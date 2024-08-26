import { computerScience } from "./computer-science";
import { Config, Option } from "./types";

export function config(): Config {
  return {
    calendars: [...computerScience],
  };
}
