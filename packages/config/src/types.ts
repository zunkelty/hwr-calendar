export interface Option {
  id: string;
  name: string;
  // eslint-disable-next-line no-unused-vars
  shouldRemove: (value: string) => boolean;
}

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
