import { Option } from "../types";

export const excludeEnglish: Option = {
  id: "hide-english",
  name: "Hide English courses",
  shouldRemove: (value) => new RegExp("Englisch", "").test(value),
};

export const noGroup1: Option = {
  id: "hide-group-1",
  name: "Hide courses of group 1",
  shouldRemove: (value) => new RegExp(".*Gruppe 1.*", "").test(value),
};

export const noGroup2: Option = {
  id: "hide-group-2",
  name: "Hide courses of group 2",
  shouldRemove: (value) => new RegExp(".*Gruppe 2.*", "").test(value),
};
