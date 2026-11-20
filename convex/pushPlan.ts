// Pure rules for phone notifications: which times are allowed, what is due now, and what it says.
import { dareForDay, dayNumber } from "./content";

export const MORNING_TIMES = ["06:30", "07:00", "07:30", "08:00", "08:30", "09:00"];
export const EVENING_TIMES = ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"];
export const SUNDAY_TIME = "18:00";

export type Kind = "morning" | "evening" | "sunday";
export type Sub = { morning?: string; evening?: string; sunday: boolean; sent?: Record<string, string> };

/** Which notifications are due for this device at this UK clock time (hh:mm on the half hour). */
export function dueKinds(sub: Sub, hhmm: string, weekday: number, dateKey: string): Kind[] {
  const out: Kind[] = [];
  const fresh = (k: Kind) => (sub.sent?.[k] ?? "") !== dateKey;
  if (sub.morning === hhmm && fresh("morning")) out.push("morning");
  if (sub.evening === hhmm && fresh("evening")) out.push("evening");
  if (sub.sunday && weekday === 0 && hhmm === SUNDAY_TIME && fresh("sunday")) out.push("sunday");
  return out;
}

/** Rounds a clock time down to the half hour, so a slightly late run still matches. */
export function halfHour(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${minute < 30 ? "00" : "30"}`;
}

/** The words on the notification. Never includes anything from the journal. */
export function message(kind: Kind, appUrl: string, d: { year: number; month: number; day: number }) {
  if (kind === "morning") return { title: "Good morning", body: `Make your promise for today and check in. Today’s dare: ${dareForDay(dayNumber(d.year, d.month, d.day))}`, url: `${appUrl}/#today`, tag: "morning" };
  if (kind === "evening") return { title: "How did today go?", body: "Check in on your pattern and do your evening reflection. Where did you do well today?", url: `${appUrl}/#today`, tag: "evening" };
  return { title: "Close your week", body: "It’s Sunday. Review this week’s step and set the next one.", url: `${appUrl}/#future`, tag: "sunday" };
}
