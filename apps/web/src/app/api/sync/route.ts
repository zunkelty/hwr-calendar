import { config } from "@repo/config";
import { NextRequest } from "next/server";
import { z } from "zod";
import { fromError } from "zod-validation-error";
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

export const GET = async (request: NextRequest) => {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  await Promise.all(
    config().calendars.map(async (calendarConfig) => {
      // 1. Retrieve current calendar from Moodle
      const calendarStr = await retrieveCalendar(calendarConfig.ical);

      // 2. Retrieve current calendar from Moodle & parse

      if (calendarStr.isErr) {
        return handleError(calendarStr.error);
      }

      const calendar = parseCalendar(calendarStr.value);

      // 3. Retrieve stored calendar events from database
      const storedCalendarResult = await db.retrieveCalendar(
        calendarConfig.ical
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
    })
  );

  return new Response("Ok");
};
