export interface Option {
  id: string;
  name: string;
  // eslint-disable-next-line no-unused-vars
  shouldRemove: (value: string) => boolean;
}

export interface Calendar {
  fieldOfStudy: string;
  semester: number;
  course: string;
  ical: string;
  options: Option[];
}

export interface Config {
  calendars: Calendar[];
}
