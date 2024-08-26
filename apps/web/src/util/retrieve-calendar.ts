import { Result } from "true-myth";
import { Error } from "../errors";

export async function retrieveCalendar(
  ical: string
): Promise<Result<string, Error>> {
  try {
    const result = await fetch(ical, {
      next: { revalidate: 3600 },
    });
    const text = await result.text();

    if (!result.ok) {
      console.error("Failed to find calendar with status", result.status, text);

      return Result.err({
        code: "not_found",
        message: "Calendar not found",
      });
    }

    return Result.ok(text);
  } catch (error) {
    console.error("Failed to retrieve calendar", error);

    return Result.err({
      code: "internal_error",
      message: "Unknown error",
    });
  }
}
