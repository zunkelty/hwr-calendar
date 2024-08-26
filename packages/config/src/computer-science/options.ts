import { Option } from "../types";

export const excludeEnglish: Option = {
  type: "exclude-regex",
  id: "hide-english",
  name: "Hide English courses",
  regex: new RegExp("Englisch", ""),
};

export const noGroup1: Option = {
  type: "exclude-regex",
  id: "hide-group-1",
  name: "Hide courses of group 1",
  regex: new RegExp(".*Gruppe 1.*", ""),
};

export const noGroup2: Option = {
  type: "exclude-regex",
  id: "hide-group-2",
  name: "Hide courses of group 2",
  regex: new RegExp(".*Gruppe 2.*", ""),
};
