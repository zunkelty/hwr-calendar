import { config } from "@repo/config";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { handleError } from "@/errors";
import { retrieveCalendar } from "@/lib/retrieve-calendar";
import { parseCalendar } from "@/lib/calendar";
import { db } from "@/lib/db";

import ical, {
  ICalCalendarMethod,
  ICalEventClass,
  ICalEventRepeatingFreq,
} from "ical-generator";
import moment from "moment";
import { getVtimezoneComponent } from "@touch4it/ical-timezones";

const ParamsSchema = z.object({
  url: z.string(),
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
  const calendarConfig = config().calendars.find(
    (cal) => cal.ical === params.data.url
  );

  if (!calendarConfig) {
    return handleError({
      code: "not_found",
      message: "Calendar not found",
    });
  }

  const selectedOptions = calendarConfig.options.filter((optn) =>
    query.data.options?.includes(optn.id)
  );

  // 2. Retrieve current calendar from Moodle & parse
  const calendarStr = await retrieveCalendar(calendarConfig.ical);

  if (calendarStr.isErr) {
    return handleError(calendarStr.error);
  }

  const calendar = parseCalendar(calendarStr.value);

  // 3. Retrieve stored calendar events from database
  const storedCalendarResult = await db.retrieveCalendar(calendarConfig.ical);

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

  // If there are no future events, delete the stored calendar
  if (futureEvents.length === 0) {
    await db.deleteCalendar(calendarConfig.ical);
  }

  const mergedEvents = [...pastEvents, ...futureEvents];

  // 5. Store merged calendar events in database
  const storeCalendarResult = await db.storeCalendar(
    calendarConfig.ical,
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
    name: "HWR Calendar - hwr.soenkep.com",
  });

  calendarIcal.timezone({
    name: "Europe/Berlin",
    generator: getVtimezoneComponent,
  });

  calendarIcal.method(ICalCalendarMethod.REQUEST);

  calendarIcal.createEvent({
    summary: "Sönkes Geburtstag", // :)
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
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="${calendarConfig.fieldOfStudy} Semester ${calendarConfig.semester} Kurs ${calendarConfig.course}.ics"`,
    },
  });
};
