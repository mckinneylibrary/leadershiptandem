import { useState } from "react";
import {
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  toLocalInput,
  type CalendarEvent,
} from "@/lib/calendar";

type Props = {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationMinutes?: number;
  repeatEveryDays?: number | null;
  /** Show the repeat checkbox */
  allowRepeat?: boolean;
  label?: string;
  className?: string;
};

const box = "rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring";

export function AddToCalendar({
  title,
  description,
  location,
  start,
  durationMinutes = 30,
  repeatEveryDays = null,
  allowRepeat = false,
  label = "Add to calendar",
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [when, setWhen] = useState(toLocalInput(start));
  const [mins, setMins] = useState(durationMinutes);
  const [repeat, setRepeat] = useState(allowRepeat);

  const event: CalendarEvent = {
    title,
    ...(description ? { description } : {}),
    ...(location ? { location } : {}),
    start: new Date(when),
    durationMinutes: mins,
    repeatEveryDays: allowRepeat && repeat ? repeatEveryDays : null,
  };

  const linkCls = "rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted";

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-medium text-primary hover:underline"
      >
        {label}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-72 space-y-3 rounded-lg border bg-card p-4 shadow-lg">
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Date and time</span>
            <input type="datetime-local" className={`${box} w-full`} value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-muted-foreground">Length</span>
            <select className={`${box} w-full`} value={mins} onChange={(e) => setMins(Number(e.target.value))}>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>1 hour</option>
            </select>
          </label>
          {allowRepeat && repeatEveryDays ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="accent-primary" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
              Repeat on the usual rhythm
            </label>
          ) : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <a className={linkCls} href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
              Google
            </a>
            <a className={linkCls} href={outlookCalendarUrl(event)} target="_blank" rel="noreferrer" onClick={() => setOpen(false)}>
              Outlook
            </a>
            <button type="button" className={linkCls} onClick={() => { downloadIcs(event); setOpen(false); }}>
              Apple / other
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Invite the other person from your own calendar so they get it too.</p>
        </div>
      )}
    </div>
  );
}
