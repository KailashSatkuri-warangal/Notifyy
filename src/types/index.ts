export type ActivityType = "meeting" | "follow_up";

export type ActivityStatus = "pending" | "completed" | "rescheduled" | "cancelled" | "overdue";

export type ReminderOffset = "at_time" | "15_min" | "30_min" | "1_hour" | "1_day" | "none";

export interface Contact {
  id: string;
  name: string;
  company: string;
  mobile: string;
  email?: string;
  address?: string;
  notes?: string;
  avatarColor?: string;
  isArchived?: boolean;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Meeting {
  id: string;
  contactId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour)
  location?: string;
  purpose?: string;
  notes?: string;
  reminder: ReminderOffset;
  status: ActivityStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  id: string;
  contactId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour)
  notes?: string;
  reminder: ReminderOffset;
  status: ActivityStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  contactId: string;
  meetingId?: string;
  followUpId?: string;
  activityType?: "meeting" | "follow_up" | "call" | "general";
  activityId?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  activityType: ActivityType;
  activityId: string;
  contactId: string;
  title: string;
  reminderTime: string; // ISO 8601 string
  notificationStatus: "pending" | "sent" | "dismissed" | "failed";
  createdAt: string;
  updatedAt: string;
}

export interface ActivityHistory {
  id: string;
  contactId: string;
  activityType: "meeting" | "follow_up" | "call" | "note" | "contact";
  activityId: string;
  action:
    | "created"
    | "edited"
    | "called"
    | "note_added"
    | "completed"
    | "rescheduled"
    | "cancelled"
    | "reminder_sent"
    | "archived";
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  reason?: string;
  createdAt: string;
}

export interface UserSettings {
  name: string;
  mobile?: string;
  email?: string;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string; // e.g., "08:00"
  meetingReminderEnabled: boolean;
  followUpReminderEnabled: boolean;
  overdueAlertsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultReminder: ReminderOffset;
  theme: "light" | "dark" | "system";
}

export interface AppNotification {
  id: string;
  type: "daily_summary" | "meeting_reminder" | "followup_reminder" | "overdue_alert" | "system";
  title: string;
  message: string;
  activityId?: string;
  activityType?: ActivityType;
  contactId?: string;
  timestamp: string;
  isRead: boolean;
}

// Unified Activity View Model for Dashboard & Calendar
export interface UnifiedActivity {
  id: string;
  type: ActivityType;
  contactId: string;
  contactName: string;
  contactCompany: string;
  contactMobile: string;
  title: string;
  date: string;
  time: string;
  dateTime: Date;
  location?: string;
  purpose?: string;
  notes?: string;
  reminder: ReminderOffset;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BackupData {
  version: number;
  exportedAt: string;
  contacts: Contact[];
  meetings: Meeting[];
  followUps: FollowUp[];
  notes: Note[];
  reminders: Reminder[];
  history: ActivityHistory[];
  settings: UserSettings;
  notifications: AppNotification[];
}
