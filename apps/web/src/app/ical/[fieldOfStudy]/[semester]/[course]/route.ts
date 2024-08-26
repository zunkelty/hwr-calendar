import { config } from "@repo/config";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { findCalendar } from "@/util/find-calendar";
import { handleError } from "@/errors";
import { retrieveCalendar } from "@/util/retrieve-calendar";
import { parseCalendar } from "@/util/calendar";
import { db } from "@/util/db";

import ical, {
  ICalCalendarMethod,
  ICalEventClass,
  ICalEventRepeatingFreq,
} from "ical-generator";
import moment from "moment";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";

const ParamsSchema = z.object({
  fieldOfStudy: z.string(),
  course: z.string(),
  semester: z.string(),
});

type Params = z.infer<typeof ParamsSchema>;

const QueryOptions = z.object({
  options: z
    .string()
    .transform((val, ctx) => {
      const split = val.split(",");

      if (split.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No valid options provided",
        });
      }

      return split;
    })
    .nullable()
    .optional(),
});

export const GET = async (req: NextRequest, props: { params: Params }) => {
  const params = ParamsSchema.safeParse(props.params);

  if (!params.success) {
    const validationError = fromError(params.error);

    return new Response(`Invalid search params: ${validationError.message}`, {
      status: 400,
    });
  }

  const query = QueryOptions.safeParse({
    options: req.nextUrl.searchParams.get("options"),
  });

  if (!query.success) {
    const validationError = fromError(query.error);

    return new Response(`Invalid query params: ${validationError.message}`, {
      status: 400,
    });
  }

  // 1. Find calendar

  const calendarConfig = findCalendar({
    availableCourses: config().courses,
    ...params.data,
  });

  if (calendarConfig.isErr) {
    return handleError(calendarConfig.error);
  }

  const selectedOptions = calendarConfig.value.options.filter((optn) =>
    query.data.options?.includes(optn.id)
  );

  // 2. Retrieve current calendar from Moodle & parse
  const calendarStr = await retrieveCalendar(calendarConfig.value.ical);

  if (calendarStr.isErr) {
    return handleError(calendarStr.error);
  }

  const calendar = parseCalendar(calendarStr.value);

  // 3. Retrieve stored calendar events from database
  const storedCalendarResult = await db.retrieveCalendar(
    calendarConfig.value.ical
  );

  if (
    storedCalendarResult.isErr &&
    storedCalendarResult.error.code !== "not_found"
  ) {
    return handleError(storedCalendarResult.error);
  }

  const storedCalendar = storedCalendarResult.isOk
    ? storedCalendarResult
    : { value: [] };

  // 4. Merge calendar events where all events from the past are taken from the stored calendar and all future events are taken from the current calendar
  const pastEvents = storedCalendar.value.filter((event) => {
    if (!event.end) return false;
    return new Date(event.end) < new Date();
  });

  const futureEvents = calendar.events.filter((event) => {
    if (!event.end) return false;
    return new Date(event.end) > new Date();
  });

  const mergedEvents = [...pastEvents, ...futureEvents];

  // 5. Store merged calendar events in database
  const storeCalendarResult = await db.storeCalendar(
    calendarConfig.value.ical,
    mergedEvents
  );

  if (storeCalendarResult.isErr) {
    return handleError(storeCalendarResult.error);
  }

  // 3. Filter calendar events
  const filteredEvents = mergedEvents.filter((event) => {
    const shouldRemove = selectedOptions.some((optn) => {
      return optn.shouldRemove(`${event.summary} ${event.description}`);
    });

    return !shouldRemove;
  });

  // 4. Construct ICAL response combining filtered events and the meta data
  calendar.events = filteredEvents;

  const calendarIcal = ical({
    name: "HWR Calendar - soenkep.com",
  });

  calendarIcal.timezone({
    name: "Europe/Berlin",
    generator: getVtimezoneComponent,
  });

  calendarIcal.method(ICalCalendarMethod.REQUEST);

  calendarIcal.createEvent({
    summary: "Sönkes Geburtstag",
    start: moment("2002-10-16"),
    end: moment("2002-10-16"),
    allDay: true,
    repeating: {
      freq: ICalEventRepeatingFreq.YEARLY,
    },
  });

  calendar.events.forEach((event) => {
    calendarIcal.createEvent({
      id: `created-by-soenkep-${event.uid}`,
      summary: event.summary,
      description: event.description,
      start: moment(event.start),
      end: moment(event.end),
      priority: 5,
      class: ICalEventClass.PUBLIC,
      timezone: "Europe/Berlin",
    });
  });

  return new Response(calendarIcal.toString(), {
    headers: {
      "Content-Type": "text/plain",
    },
  });
};
