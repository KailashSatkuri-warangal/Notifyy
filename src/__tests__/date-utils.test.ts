import { describe, it, expect } from "vitest";
import { calculateReminderTime, formatActivityDate, formatActivityTime } from "../lib/date-utils";
import { format, addDays } from "date-fns";

describe("Date Utilities & Reminder Calculation", () => {
  const testDate = "2026-10-15";
  const testTime = "14:00";

  it("calculates at_time reminder correctly", () => {
    const res = calculateReminderTime(testDate, testTime, "at_time");
    expect(res).not.toBeNull();
    expect(res?.getHours()).toBe(14);
    expect(res?.getMinutes()).toBe(0);
  });

  it("calculates 15_min before reminder correctly", () => {
    const res = calculateReminderTime(testDate, testTime, "15_min");
    expect(res?.getHours()).toBe(13);
    expect(res?.getMinutes()).toBe(45);
  });

  it("calculates 1_hour before reminder correctly", () => {
    const res = calculateReminderTime(testDate, testTime, "1_hour");
    expect(res?.getHours()).toBe(13);
    expect(res?.getMinutes()).toBe(0);
  });

  it("calculates 1_day before reminder correctly", () => {
    const res = calculateReminderTime(testDate, testTime, "1_day");
    expect(res?.getDate()).toBe(14);
  });

  it("returns null when offset is none", () => {
    const res = calculateReminderTime(testDate, testTime, "none");
    expect(res).toBeNull();
  });

  it("formats activity time correctly", () => {
    expect(formatActivityTime("09:00")).toBe("9:00 AM");
    expect(formatActivityTime("14:30")).toBe("2:30 PM");
  });
});
