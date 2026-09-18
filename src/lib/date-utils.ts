import {
  format,
  parse,
  isToday as isDateToday,
  isTomorrow as isDateTomorrow,
  isYesterday as isDateYesterday,
  isBefore,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  addHours,
  subHours,
  subMinutes,
  addMinutes,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  nextMonday,
} from "date-fns";
import { ReminderOffset } from "@/types";

export function parseActivityDateTime(dateStr: string, timeStr: string): Date {
  if (!dateStr) return new Date();
  
  // Extract hours & minutes cleanly
  let hours = 9;
  let minutes = 0;
  
  if (timeStr) {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const digitsOnly = timeStr.replace(/[^0-9:]/g, "");
    const parts = digitsOnly.split(":").map(Number);
    
    if (parts.length >= 1 && !isNaN(parts[0])) {
      hours = parts[0];
      if (isPM && hours < 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
    if (parts.length >= 2 && !isNaN(parts[1])) {
      minutes = parts[1];
    }
  }

  const dateParts = dateStr.split("-").map(Number);
  const year = dateParts[0] || new Date().getFullYear();
  const month = (dateParts[1] || 1) - 1;
  const day = dateParts[2] || 1;

  return new Date(year, month, day, hours, minutes, 0, 0);
}

export function formatActivityDate(dateStr: string): string {
  try {
    const parts = dateStr.split("-").map(Number);
    const parsed = new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0);
    if (isDateToday(parsed)) return "Today";
    if (isDateTomorrow(parsed)) return "Tomorrow";
    if (isDateYesterday(parsed)) return "Yesterday";
    return format(parsed, "EEE, d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatActivityTime(timeStr: string): string {
  if (!timeStr) return "";
  try {
    const isPM = /pm/i.test(timeStr);
    const isAM = /am/i.test(timeStr);
    const digitsOnly = timeStr.replace(/[^0-9:]/g, "");
    const parts = digitsOnly.split(":").map(Number);
    
    let hours = parts[0] || 0;
    const minutes = parts[1] || 0;

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const dummy = new Date(2026, 0, 1, hours, minutes, 0);
    return format(dummy, "h:mm a");
  } catch {
    return timeStr;
  }
}

export function formatFullDateTime(dateStr: string, timeStr: string): string {
  return `${formatActivityDate(dateStr)} · ${formatActivityTime(timeStr)}`;
}

export function isPastActivity(dateStr: string, timeStr: string): boolean {
  const dt = parseActivityDateTime(dateStr, timeStr);
  return isBefore(dt, new Date());
}

export function calculateReminderTime(
  dateStr: string,
  timeStr: string,
  offset: ReminderOffset
): Date | null {
  if (offset === "none") return null;
  const activityDt = parseActivityDateTime(dateStr, timeStr);

  switch (offset) {
    case "at_time":
      return activityDt;
    case "15_min":
      return subMinutes(activityDt, 15);
    case "30_min":
      return subMinutes(activityDt, 30);
    case "1_hour":
      return subHours(activityDt, 1);
    case "1_day":
      return subDays(activityDt, 1);
    default:
      return subHours(activityDt, 1);
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getTodayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function getCurrentTimeString(): string {
  return format(new Date(), "HH:mm");
}

export function getTomorrowDateString(): string {
  return format(addDays(new Date(), 1), "yyyy-MM-dd");
}

export function getNextMondayDateString(): string {
  return format(nextMonday(new Date()), "yyyy-MM-dd");
}

export function getRelativeTimeLabel(dateStr: string, timeStr: string): string {
  const target = parseActivityDateTime(dateStr, timeStr);
  const now = new Date();

  if (isBefore(target, now)) {
    const diffM = differenceInMinutes(now, target);
    if (diffM < 60) return `${diffM}m overdue`;
    const diffH = differenceInHours(now, target);
    if (diffH < 24) return `${diffH}h overdue`;
    const diffD = differenceInDays(now, target);
    return `${diffD}d overdue`;
  } else {
    const diffM = differenceInMinutes(target, now);
    if (diffM <= 60) return `in ${diffM}m`;
    const diffH = differenceInHours(target, now);
    if (diffH < 24) return `in ${diffH}h`;
    const diffD = differenceInDays(target, now);
    return `in ${diffD}d`;
  }
}

/**
 * Format Date to UTC Google Calendar format: YYYYMMDDTHHmmSSZ
 */
function toGCalUtcString(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Generate 1-Click Google Calendar Add Link
 */
export function generateGoogleCalendarUrl(params: {
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  location?: string;
  description?: string;
}): string {
  const startDate = parseActivityDateTime(params.date, params.time);
  const duration = params.durationMinutes || 30;
  const endDate = addMinutes(startDate, duration);

  const startUtc = toGCalUtcString(startDate);
  const endUtc = toGCalUtcString(endDate);

  const baseUrl = "https://calendar.google.com/calendar/render";
  const searchParams = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${startUtc}/${endUtc}`,
    details: params.description || "",
    location: params.location || "",
  });

  return `${baseUrl}?${searchParams.toString()}`;
}

/**
 * Generate RFC 5545 iCalendar (.ics) content for single or multiple activities
 */
export function generateIcsContent(
  events: Array<{
    id?: string;
    title: string;
    date: string;
    time: string;
    durationMinutes?: number;
    location?: string;
    description?: string;
  }>
): string {
  const nowUtc = toGCalUtcString(new Date());

  const eventBlocks = events
    .map((event) => {
      const startDate = parseActivityDateTime(event.date, event.time);
      const duration = event.durationMinutes || 30;
      const endDate = addMinutes(startDate, duration);
      const uid = event.id ? `${event.id}@notifyy.app` : `${Date.now()}-${Math.random()}@notifyy.app`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${nowUtc}`,
        `DTSTART:${toGCalUtcString(startDate)}`,
        `DTEND:${toGCalUtcString(endDate)}`,
        `SUMMARY:${event.title.replace(/\n/g, "\\n")}`,
        event.description ? `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}` : "",
        event.location ? `LOCATION:${event.location.replace(/\n/g, "\\n")}` : "",
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ]
        .filter(Boolean)
        .join("\r\n");
    })
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Notifyy//Smart Follow-Up Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    eventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Trigger download of .ics calendar file
 */
export function downloadIcsFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export {
  format,
  parse,
  isDateToday as isToday,
  isDateTomorrow as isTomorrow,
  isDateYesterday as isYesterday,
  isBefore,
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  subHours,
  subMinutes,
  addMinutes,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
};
