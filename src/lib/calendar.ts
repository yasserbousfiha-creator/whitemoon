import { SLOT_MINUTES } from "./slots";

// "Add to calendar" after a booking (components/Booking.tsx): a Google Calendar link, and an .ics file that iPhone and
// every other calendar open. Slots are Riyadh wall-clock (UTC+3, no DST), written here in UTC.

export interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM, Riyadh
  location: string;
  details: string;
}

function utcStamp(date: string, time: string, plusMinutes = 0) {
  const [y, m, d] = date.split("-").map(Number);
  const [h, min] = time.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - 3, min + plusMinutes)).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(e: CalendarEvent) {
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${utcStamp(e.date, e.time)}/${utcStamp(e.date, e.time, SLOT_MINUTES)}`,
    details: e.details,
    location: e.location,
    ctz: "Asia/Riyadh",
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

// iCalendar text: commas, semicolons and backslashes escaped, line breaks as \n.
const ics = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, "\\n");

/** Downloads the appointment as an .ics file, reminding a day and two hours before. */
export function downloadIcs(e: CalendarEvent) {
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//White Moon//Booking//AR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${utcStamp(e.date, e.time)}-${Math.random().toString(36).slice(2)}@whitemoonclinic.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART:${utcStamp(e.date, e.time)}`,
    `DTEND:${utcStamp(e.date, e.time, SLOT_MINUTES)}`,
    `SUMMARY:${ics(e.title)}`,
    `DESCRIPTION:${ics(e.details)}`,
    `LOCATION:${ics(e.location)}`,
    ...["-P1D", "-PT2H"].flatMap((at) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${ics(e.title)}`, `TRIGGER:${at}`, "END:VALARM"]),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "white-moon-appointment.ics";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
