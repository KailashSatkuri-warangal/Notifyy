import { getDB } from "../db";
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
import {
  IContactRepository,
  IMeetingRepository,
  IFollowUpRepository,
  INoteRepository,
  IReminderRepository,
  IActivityHistoryRepository,
  ISettingsRepository,
  INotificationRepository,
} from "../interfaces";
import { DEFAULT_USER_SETTINGS } from "@/lib/constants";

export class IdbContactRepository implements IContactRepository {
  async getAll(): Promise<Contact[]> {
    const db = await getDB();
    const contacts = await db.getAll("contacts");
    return contacts.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  async getById(id: string): Promise<Contact | undefined> {
    const db = await getDB();
    return db.get("contacts", id);
  }

  async create(contact: Contact): Promise<Contact> {
    const db = await getDB();
    await db.put("contacts", contact);
    return contact;
  }

  async update(contact: Contact): Promise<Contact> {
    const db = await getDB();
    await db.put("contacts", contact);
    return contact;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("contacts", id);
  }

  async search(query: string): Promise<Contact[]> {
    const all = await this.getAll();
    const q = query.toLowerCase().trim();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }
}

export class IdbMeetingRepository implements IMeetingRepository {
  async getAll(): Promise<Meeting[]> {
    const db = await getDB();
    return db.getAll("meetings");
  }

  async getById(id: string): Promise<Meeting | undefined> {
    const db = await getDB();
    return db.get("meetings", id);
  }

  async getByContactId(contactId: string): Promise<Meeting[]> {
    const db = await getDB();
    const index = db.transaction("meetings").store.index("by-contact");
    return index.getAll(contactId);
  }

  async getByDate(date: string): Promise<Meeting[]> {
    const db = await getDB();
    const index = db.transaction("meetings").store.index("by-date");
    return index.getAll(date);
  }

  async create(meeting: Meeting): Promise<Meeting> {
    const db = await getDB();
    await db.put("meetings", meeting);
    return meeting;
  }

  async update(meeting: Meeting): Promise<Meeting> {
    const db = await getDB();
    await db.put("meetings", meeting);
    return meeting;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("meetings", id);
  }
}

export class IdbFollowUpRepository implements IFollowUpRepository {
  async getAll(): Promise<FollowUp[]> {
    const db = await getDB();
    return db.getAll("followUps");
  }

  async getById(id: string): Promise<FollowUp | undefined> {
    const db = await getDB();
    return db.get("followUps", id);
  }

  async getByContactId(contactId: string): Promise<FollowUp[]> {
    const db = await getDB();
    const index = db.transaction("followUps").store.index("by-contact");
    return index.getAll(contactId);
  }

  async getByDate(date: string): Promise<FollowUp[]> {
    const db = await getDB();
    const index = db.transaction("followUps").store.index("by-date");
    return index.getAll(date);
  }

  async create(followUp: FollowUp): Promise<FollowUp> {
    const db = await getDB();
    await db.put("followUps", followUp);
    return followUp;
  }

  async update(followUp: FollowUp): Promise<FollowUp> {
    const db = await getDB();
    await db.put("followUps", followUp);
    return followUp;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("followUps", id);
  }
}

export class IdbNoteRepository implements INoteRepository {
  async getAll(): Promise<Note[]> {
    const db = await getDB();
    const notes = await db.getAll("notes");
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<Note | undefined> {
    const db = await getDB();
    return db.get("notes", id);
  }

  async getByContactId(contactId: string): Promise<Note[]> {
    const db = await getDB();
    const index = db.transaction("notes").store.index("by-contact");
    const notes = await index.getAll(contactId);
    return notes.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByMeetingId(meetingId: string): Promise<Note[]> {
    const db = await getDB();
    const index = db.transaction("notes").store.index("by-meeting");
    return index.getAll(meetingId);
  }

  async getByFollowUpId(followUpId: string): Promise<Note[]> {
    const db = await getDB();
    const index = db.transaction("notes").store.index("by-followup");
    return index.getAll(followUpId);
  }

  async create(note: Note): Promise<Note> {
    const db = await getDB();
    await db.put("notes", note);
    return note;
  }

  async update(note: Note): Promise<Note> {
    const db = await getDB();
    await db.put("notes", note);
    return note;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("notes", id);
  }
}

export class IdbReminderRepository implements IReminderRepository {
  async getAll(): Promise<Reminder[]> {
    const db = await getDB();
    return db.getAll("reminders");
  }

  async getById(id: string): Promise<Reminder | undefined> {
    const db = await getDB();
    return db.get("reminders", id);
  }

  async getByActivityId(activityId: string): Promise<Reminder[]> {
    const db = await getDB();
    const index = db.transaction("reminders").store.index("by-activity");
    return index.getAll(activityId);
  }

  async getPendingReminders(beforeTime?: string): Promise<Reminder[]> {
    const db = await getDB();
    const all = await db.getAll("reminders");
    return all.filter((r) => {
      if (r.notificationStatus !== "pending") return false;
      if (beforeTime) return r.reminderTime <= beforeTime;
      return true;
    });
  }

  async create(reminder: Reminder): Promise<Reminder> {
    const db = await getDB();
    await db.put("reminders", reminder);
    return reminder;
  }

  async update(reminder: Reminder): Promise<Reminder> {
    const db = await getDB();
    await db.put("reminders", reminder);
    return reminder;
  }

  async delete(id: string): Promise<void> {
    const db = await getDB();
    await db.delete("reminders", id);
  }

  async deleteByActivityId(activityId: string): Promise<void> {
    const db = await getDB();
    const reminders = await this.getByActivityId(activityId);
    const tx = db.transaction("reminders", "readwrite");
    for (const r of reminders) {
      tx.store.delete(r.id);
    }
    await tx.done;
  }
}

export class IdbActivityHistoryRepository implements IActivityHistoryRepository {
  async getAll(): Promise<ActivityHistory[]> {
    const db = await getDB();
    const history = await db.getAll("history");
    return history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByContactId(contactId: string): Promise<ActivityHistory[]> {
    const db = await getDB();
    const index = db.transaction("history").store.index("by-contact");
    const history = await index.getAll(contactId);
    return history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getByActivityId(activityId: string): Promise<ActivityHistory[]> {
    const db = await getDB();
    const index = db.transaction("history").store.index("by-activity");
    const history = await index.getAll(activityId);
    return history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(history: ActivityHistory): Promise<ActivityHistory> {
    const db = await getDB();
    await db.put("history", history);
    return history;
  }

  async deleteByContactId(contactId: string): Promise<void> {
    const db = await getDB();
    const items = await this.getByContactId(contactId);
    const tx = db.transaction("history", "readwrite");
    for (const item of items) {
      tx.store.delete(item.id);
    }
    await tx.done;
  }
}

export class IdbSettingsRepository implements ISettingsRepository {
  private static readonly SETTINGS_KEY = "user_settings";

  async get(): Promise<UserSettings> {
    const db = await getDB();
    const settings = (await db.get("settings", IdbSettingsRepository.SETTINGS_KEY as any)) as unknown as UserSettings;
    return settings || DEFAULT_USER_SETTINGS;
  }

  async save(settings: UserSettings): Promise<UserSettings> {
    const db = await getDB();
    await db.put("settings", settings as any, IdbSettingsRepository.SETTINGS_KEY as any);
    return settings;
  }
}

export class IdbNotificationRepository implements INotificationRepository {
  async getAll(): Promise<AppNotification[]> {
    const db = await getDB();
    const notifs = await db.getAll("notifications");
    return notifs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  async getUnread(): Promise<AppNotification[]> {
    const all = await this.getAll();
    return all.filter((n) => !n.isRead);
  }

  async create(notification: AppNotification): Promise<AppNotification> {
    const db = await getDB();
    await db.put("notifications", notification);
    return notification;
  }

  async markAsRead(id: string): Promise<void> {
    const db = await getDB();
    const notif = await db.get("notifications", id);
    if (notif) {
      notif.isRead = true;
      await db.put("notifications", notif);
    }
  }

  async markAllAsRead(): Promise<void> {
    const db = await getDB();
    const all = await db.getAll("notifications");
    const tx = db.transaction("notifications", "readwrite");
    for (const notif of all) {
      notif.isRead = true;
      tx.store.put(notif);
    }
    await tx.done;
  }

  async clearAll(): Promise<void> {
    const db = await getDB();
    await db.clear("notifications");
  }
}
