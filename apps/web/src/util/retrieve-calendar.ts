import { Result } from "true-myth";
import { Option } from "../../../../packages/config/src/types";
import { Error } from "../errors";

interface CalendarParams {
  fieldOfStudy: string;
  semester: string;
  course: string;
  options: Option[];
}

export async function retrieveCalendar(
  params: CalendarParams
): Promise<Result<undefined, Error>> {
  return Result.ok(undefined);
}
