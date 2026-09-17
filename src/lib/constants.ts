import { ReminderOffset, UserSettings } from "@/types";

export const REMINDER_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: "at_time", label: "At time of activity" },
  { value: "15_min", label: "15 minutes before" },
  { value: "30_min", label: "30 minutes before" },
  { value: "1_hour", label: "1 hour before (Default)" },
  { value: "1_day", label: "1 day before" },
  { value: "none", label: "No reminder" },
];

export const DEFAULT_USER_SETTINGS: UserSettings = {
  name: "Alex Morgan",
  mobile: "+91 98765 43210",
  email: "alex.morgan@notifyy.app",
  dailySummaryEnabled: true,
  dailySummaryTime: "08:00",
  meetingReminderEnabled: true,
  followUpReminderEnabled: true,
  overdueAlertsEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
  defaultReminder: "1_hour",
  theme: "system",
};

export const APP_METADATA = {
  name: "Notifyy",
  tagline: "Never Miss a Follow-Up.",
  supportingPhrase: "See. Call. Note. Follow Up.",
  description: "Smart meetings, calls, notes, and recurring follow-up management assistant.",
  version: "1.0.0",
};
