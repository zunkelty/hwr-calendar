import { config } from "@repo/config";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fromError } from "zod-validation-error";
import { findCalendar } from "../../../../../util/find-calendar";
import { handleError } from "../../../../../errors";
import { retrieveCalendar } from "../../../../../util/retrieve-calendar";

import * as ical from "ical";

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

  // 2. Retrieve existing calendar from database
  // const calendar = await db.retrieveCalendar(calendarConfig.value.ical);

  const calendarStr = await retrieveCalendar(calendarConfig.value.ical);

  if (calendarStr.isErr) {
    return handleError(calendarStr.error);
  }

  const calendar = ical.parseICS(calendarStr.value);

  const meta: ical.CalendarComponent[] = [];
  const events: ical.CalendarComponent[] = [];

  Object.entries(calendar).map(([_, event]) => {
    if (event.type === "VEVENT") {
      events.push(event);
      return;
    }

    meta.push(event);
  });

  return new Response(JSON.stringify(meta), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
