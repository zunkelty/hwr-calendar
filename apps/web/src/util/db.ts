import { kv } from "@vercel/kv";
import { VEVENT } from "./calendar";
import { Result, Unit } from "true-myth";
import { Error } from "@/errors";

export const db = {
  retrieveCalendar: async (
    icalUrl: string
  ): Promise<Result<VEVENT[], Error>> => {
    const result = await kv.get<any>(icalUrl);

    if (!result) {
      return Result.err({
        code: "not_found",
        message: "Calendar not found",
      });
    }

    try {
      return Result.ok(result.events as VEVENT[]);
    } catch (error) {
      return Result.err({
        code: "internal_error",
        message: "Failed to parse calendar",
      });
    }
  },
  storeCalendar: async (
    icalUrl: string,
    calendar: VEVENT[]
  ): Promise<Result<Unit, Error>> => {
    const result = await kv.set(icalUrl, JSON.stringify({ events: calendar }));

    if (result !== "OK") {
      return Result.err({
        code: "internal_error",
        message: "Failed to store calendar",
      });
    }

    return Result.ok();
  },
  deleteCalendar: async (icalUrl: string): Promise<Result<Unit, Error>> => {
    const result = await kv.del(icalUrl);

    if (result !== 1) {
      return Result.err({
        code: "internal_error",
        message: "Failed to delete calendar",
      });
    }

    return Result.ok();
  },
};
