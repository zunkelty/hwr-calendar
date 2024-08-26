import { kv } from "@vercel/kv";

export const db = {
  retrieveCalendar: async (icalUrl: string) => {
    return await kv.get<string>(icalUrl);
  },
};
