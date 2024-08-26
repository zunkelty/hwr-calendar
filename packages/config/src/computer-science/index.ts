import { excludeEnglish, noGroup1, noGroup2 } from "./options";
import { Calendar, Option } from "../types";

const optionsBySemester: Record<number, Option[]> = {
  1: [excludeEnglish, noGroup1, noGroup2],
  2: [excludeEnglish, noGroup1, noGroup2],
  3: [excludeEnglish, noGroup1, noGroup2],
  4: [excludeEnglish, noGroup1, noGroup2],
  5: [],
  6: [],
};

export const computerScience: Calendar[] = [1, 2, 3, 4, 5, 6].flatMap(
  (semester) =>
    ["A", "B"].flatMap((group) => ({
      fieldOfStudy: "Computer Science",
      semester,
      course: group,
      ical: `https://moodle.hwr-berlin.de/fb2-stundenplan/download.php?doctype=.ics&url=./fb2-stundenplaene/informatik/semester${semester}/kurs${group.toLowerCase()}`,
      options: optionsBySemester[semester] || [],
    }))
);
