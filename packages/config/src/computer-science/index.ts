import { excludeEnglish, noGroup1, noGroup2 } from "./options";
import { FieldOfStudy, Option } from "../types";

const optionsBySemester: Record<number, Option[]> = {
  1: [excludeEnglish, noGroup1, noGroup2],
  2: [excludeEnglish, noGroup1, noGroup2],
  3: [excludeEnglish, noGroup1, noGroup2],
  4: [excludeEnglish, noGroup1, noGroup2],
  5: [],
  6: [],
};

export const computerScience: FieldOfStudy = {
  id: "computer-science",
  name: "Computer Science",
  semesters: [1, 2, 3, 4, 5, 6].map((semester) => ({
    name: semester.toString(),
    courses: ["A", "B"].map((group) => ({
      name: group,
      ical: `https://moodle.hwr-berlin.de/fb2-stundenplan/download.php?doctype=.ics&url=./fb2-stundenplaene/informatik/semester${semester}/kurs${group.toLowerCase()}`,
      options: optionsBySemester[semester] || [],
    })),
  })),
};
