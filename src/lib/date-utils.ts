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
  const cleanTime = timeStr.length === 5 ? timeStr : timeStr.substring(0, 5);
  const combined = `${dateStr}T${cleanTime}:00`;
  const parsed = new Date(combined);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  return parse(`${dateStr} ${cleanTime}`, "yyyy-MM-dd HH:mm", new Date());
}

export function formatActivityDate(dateStr: string): string {
  try {
    const parsed = parse(dateStr, "yyyy-MM-dd", new Date());
    if (isDateToday(parsed)) return "Today";
    if (isDateTomorrow(parsed)) return "Tomorrow";
    if (isDateYesterday(parsed)) return "Yesterday";
    return format(parsed, "EEE, d MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function formatActivityTime(timeStr: string): string {
  try {
    const cleanTime = timeStr.substring(0, 5);
    const parsed = parse(cleanTime, "HH:mm", new Date());
    return format(parsed, "h:mm a");
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
