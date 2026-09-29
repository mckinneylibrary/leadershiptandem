export type CalendarEvent = {
  title: string;
  description?: string;
  location?: string;
  /** Local start time */
  start: Date;
  /** Minutes */
  durationMinutes: number;
  /** Repeat every N days, if this is a recurring 1-on-1 */
  repeatEveryDays?: number | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** UTC basic format: 20260930T150000Z */
function toUtcStamp(d: Date) {
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    "00Z"
  );
}

function end(e: CalendarEvent) {
  return new Date(e.start.getTime() + e.durationMinutes * 60000);
}

function rrule(e: CalendarEvent) {
  if (!e.repeatEveryDays) return null;
  const d = e.repeatEveryDays;
  if (d % 7 === 0) return `FREQ=WEEKLY;INTERVAL=${d / 7}`;
  if (d === 30) return "FREQ=MONTHLY;INTERVAL=1";
  if (d === 90) return "FREQ=MONTHLY;INTERVAL=3";
  return `FREQ=DAILY;INTERVAL=${d}`;
}

function escapeText(v: string) {
  return v.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");
}

/** Fold long lines at 75 octets as iCalendar requires. */
function fold(line: string) {
  if (line.length <= 73) return line;
  const parts: string[] = [];
  let rest = line;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  return parts.join("\r\n");
}

export function buildIcs(e: CalendarEvent) {
  const uid = `${toUtcStamp(e.start)}-${Math.random().toString(36).slice(2, 10)}@tandem`;
  const rows = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tandem//1-on-1s//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(e.start)}`,
    `DTEND:${toUtcStamp(end(e))}`,
    `SUMMARY:${escapeText(e.title)}`,
    e.description ? `DESCRIPTION:${escapeText(e.description)}` : null,
    e.location ? `LOCATION:${escapeText(e.location)}` : null,
    rrule(e) ? `RRULE:${rrule(e)}` : null,
    "BEGIN:VALARM",
    "TRIGGER:-PT10M",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];
  return rows.map(fold).join("\r\n");
}

export function downloadIcs(e: CalendarEvent, filename = "tandem-1-on-1.ics") {
  const blob = new Blob([buildIcs(e)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function googleCalendarUrl(e: CalendarEvent) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${toUtcStamp(e.start)}/${toUtcStamp(end(e))}`,
  });
  if (e.description) params.set("details", e.description);
  if (e.location) params.set("location", e.location);
  const r = rrule(e);
  if (r) params.set("recur", `RRULE:${r}`);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(e: CalendarEvent) {
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: e.title,
    startdt: e.start.toISOString(),
    enddt: end(e).toISOString(),
  });
  if (e.description) params.set("body", e.description);
  if (e.location) params.set("location", e.location);
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/** Next sensible slot: last meeting + cadence, never in the past. Defaults to 10:00 local. */
export function nextSlot(lastHeldOn: string | null | undefined, cadenceDays: number) {
  const base = lastHeldOn ? new Date(lastHeldOn.slice(0, 10) + "T10:00:00") : new Date();
  const d = new Date(base);
  if (lastHeldOn) d.setDate(d.getDate() + cadenceDays);
  d.setHours(10, 0, 0, 0);
  const now = new Date();
  if (d.getTime() < now.getTime()) {
    d.setTime(now.getTime());
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
  }
  return d;
}

/** For an <input type="datetime-local"> value */
export function toLocalInput(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
