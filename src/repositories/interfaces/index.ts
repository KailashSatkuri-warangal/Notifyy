import {
  Contact,
  Meeting,
  FollowUp,
  Note,
  Reminder,
  ActivityHistory,
  UserSettings,
  AppNotification,
} from "@/types";

export interface IContactRepository {
  getAll(): Promise<Contact[]>;
  getById(id: string): Promise<Contact | undefined>;
  create(contact: Contact): Promise<Contact>;
  update(contact: Contact): Promise<Contact>;
  delete(id: string): Promise<void>;
  search(query: string): Promise<Contact[]>;
}

export interface IMeetingRepository {
  getAll(): Promise<Meeting[]>;
  getById(id: string): Promise<Meeting | undefined>;
  getByContactId(contactId: string): Promise<Meeting[]>;
  getByDate(date: string): Promise<Meeting[]>;
  create(meeting: Meeting): Promise<Meeting>;
  update(meeting: Meeting): Promise<Meeting>;
  delete(id: string): Promise<void>;
}

export interface IFollowUpRepository {
  getAll(): Promise<FollowUp[]>;
  getById(id: string): Promise<FollowUp | undefined>;
  getByContactId(contactId: string): Promise<FollowUp[]>;
  getByDate(date: string): Promise<FollowUp[]>;
  create(followUp: FollowUp): Promise<FollowUp>;
  update(followUp: FollowUp): Promise<FollowUp>;
  delete(id: string): Promise<void>;
}

export interface INoteRepository {
  getAll(): Promise<Note[]>;
  getById(id: string): Promise<Note | undefined>;
  getByContactId(contactId: string): Promise<Note[]>;
  getByMeetingId(meetingId: string): Promise<Note[]>;
  getByFollowUpId(followUpId: string): Promise<Note[]>;
  create(note: Note): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
}

export interface IReminderRepository {
  getAll(): Promise<Reminder[]>;
  getById(id: string): Promise<Reminder | undefined>;
  getByActivityId(activityId: string): Promise<Reminder[]>;
  getPendingReminders(beforeTime?: string): Promise<Reminder[]>;
  create(reminder: Reminder): Promise<Reminder>;
  update(reminder: Reminder): Promise<Reminder>;
  delete(id: string): Promise<void>;
  deleteByActivityId(activityId: string): Promise<void>;
}

export interface IActivityHistoryRepository {
  getAll(): Promise<ActivityHistory[]>;
  getByContactId(contactId: string): Promise<ActivityHistory[]>;
  getByActivityId(activityId: string): Promise<ActivityHistory[]>;
  create(history: ActivityHistory): Promise<ActivityHistory>;
  deleteByContactId(contactId: string): Promise<void>;
}

export interface ISettingsRepository {
  get(): Promise<UserSettings>;
  save(settings: UserSettings): Promise<UserSettings>;
}

export interface INotificationRepository {
  getAll(): Promise<AppNotification[]>;
  getUnread(): Promise<AppNotification[]>;
  create(notification: AppNotification): Promise<AppNotification>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  clearAll(): Promise<void>;
}
