interface BaseOption {
  id: string;
  name: string;
}

interface ExcludeRegexOption extends BaseOption {
  regex: RegExp;
  type: "exclude-regex";
}

export type Option = ExcludeRegexOption;

export interface Course {
  name: string;
  ical: string;
  options: Option[];
}

interface Semester {
  name: string;
  courses: Course[];
}

export interface FieldOfStudy {
  id: string;
  name: string;
  semesters: Semester[];
}

export interface Config {
  courses: FieldOfStudy[];
}
