import { openDB, DBSchema, IDBPDatabase } from "idb";
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

export interface NotifyyDB extends DBSchema {
  contacts: {
    key: string;
    value: Contact;
    indexes: {
      "by-name": string;
      "by-company": string;
      "by-updated": string;
    };
  };
  meetings: {
    key: string;
    value: Meeting;
    indexes: {
      "by-contact": string;
      "by-date": string;
      "by-status": string;
    };
  };
  followUps: {
    key: string;
    value: FollowUp;
    indexes: {
      "by-contact": string;
      "by-date": string;
      "by-status": string;
    };
  };
  notes: {
    key: string;
    value: Note;
    indexes: {
      "by-contact": string;
      "by-meeting": string;
      "by-followup": string;
      "by-created": string;
    };
  };
  reminders: {
    key: string;
    value: Reminder;
    indexes: {
      "by-activity": string;
      "by-time": string;
      "by-status": string;
    };
  };
  history: {
    key: string;
    value: ActivityHistory;
    indexes: {
      "by-contact": string;
      "by-activity": string;
      "by-created": string;
    };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  notifications: {
    key: string;
    value: AppNotification;
    indexes: {
      "by-timestamp": string;
      "by-read": string;
    };
  };
}

const DB_NAME = "notifyy_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NotifyyDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<NotifyyDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only accessible in browser environment"));
  }

  if (!dbPromise) {
    dbPromise = openDB<NotifyyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Contacts store
        if (!db.objectStoreNames.contains("contacts")) {
          const contactStore = db.createObjectStore("contacts", { keyPath: "id" });
          contactStore.createIndex("by-name", "name");
          contactStore.createIndex("by-company", "company");
          contactStore.createIndex("by-updated", "updatedAt");
        }

        // Meetings store
        if (!db.objectStoreNames.contains("meetings")) {
          const meetingStore = db.createObjectStore("meetings", { keyPath: "id" });
          meetingStore.createIndex("by-contact", "contactId");
          meetingStore.createIndex("by-date", "date");
          meetingStore.createIndex("by-status", "status");
        }

        // Follow-ups store
        if (!db.objectStoreNames.contains("followUps")) {
          const followUpStore = db.createObjectStore("followUps", { keyPath: "id" });
          followUpStore.createIndex("by-contact", "contactId");
          followUpStore.createIndex("by-date", "date");
          followUpStore.createIndex("by-status", "status");
        }

        // Notes store
        if (!db.objectStoreNames.contains("notes")) {
          const noteStore = db.createObjectStore("notes", { keyPath: "id" });
          noteStore.createIndex("by-contact", "contactId");
          noteStore.createIndex("by-meeting", "meetingId");
          noteStore.createIndex("by-followup", "followUpId");
          noteStore.createIndex("by-created", "createdAt");
        }

        // Reminders store
        if (!db.objectStoreNames.contains("reminders")) {
          const reminderStore = db.createObjectStore("reminders", { keyPath: "id" });
          reminderStore.createIndex("by-activity", "activityId");
          reminderStore.createIndex("by-time", "reminderTime");
          reminderStore.createIndex("by-status", "notificationStatus");
        }

        // Activity History store
        if (!db.objectStoreNames.contains("history")) {
          const historyStore = db.createObjectStore("history", { keyPath: "id" });
          historyStore.createIndex("by-contact", "contactId");
          historyStore.createIndex("by-activity", "activityId");
          historyStore.createIndex("by-created", "createdAt");
        }

        // Settings store
        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings");
        }

        // Notifications store
        if (!db.objectStoreNames.contains("notifications")) {
          const notifStore = db.createObjectStore("notifications", { keyPath: "id" });
          notifStore.createIndex("by-timestamp", "timestamp");
          notifStore.createIndex("by-read", "isRead");
        }
      },
    });
  }

  return dbPromise;
}
