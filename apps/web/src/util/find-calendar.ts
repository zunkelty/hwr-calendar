import { Result } from "true-myth";
import { Course, FieldOfStudy } from "../../../../packages/config/src/types";
import { Error } from "../errors";

interface Params {
  availableCourses: FieldOfStudy[];
  fieldOfStudy: string;
  semester: string;
  course: string;
}

export function findCalendar({
  availableCourses,
  ...filters
}: Params): Result<Course, Error> {
  const fieldOfStudy = availableCourses.find(
    (fieldOfStudy) => fieldOfStudy.id === filters.fieldOfStudy
  );

  if (!fieldOfStudy) {
    return Result.err({
      code: "not_found",
      message: `Field of study '${filters.fieldOfStudy}' not found`,
    });
  }

  const semester = fieldOfStudy.semesters.find(
    (semester) => semester.name === filters.semester
  );

  if (!semester) {
    return Result.err({
      code: "not_found",
      message: `Semester '${filters.semester}' for ${fieldOfStudy.name} not found`,
    });
  }

  const courseGroup = semester.courses.find(
    (courseGroup) => courseGroup.name === filters.course
  );

  if (!courseGroup) {
    return Result.err({
      code: "not_found",
      message: `Course '${filters.course}' for semester ${semester.name} in ${fieldOfStudy.name} not found`,
    });
  }

  return Result.ok(courseGroup);
}
