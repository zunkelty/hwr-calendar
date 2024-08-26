import * as ical from "ical";

export type VEVENT = ical.CalendarComponent & {
  type: "VEVENT";
};

function isVEVENT(event: ical.CalendarComponent): event is VEVENT {
  return event.type === "VEVENT";
}

export function parseCalendar(raw: string) {
  const calendar = ical.parseICS(raw);

  const meta: ical.CalendarComponent[] = [];
  const events: VEVENT[] = [];

  Object.entries(calendar).map(([, event]) => {
    if (isVEVENT(event)) {
      events.push(event);
      return;
    }

    meta.push(event);
  });

  return { meta, events };
}
