import {
  IContactRepository,
  IMeetingRepository,
  IFollowUpRepository,
  INoteRepository,
  IReminderRepository,
  IActivityHistoryRepository,
  ISettingsRepository,
  INotificationRepository,
} from "./interfaces";
import {
  IdbContactRepository,
  IdbMeetingRepository,
  IdbFollowUpRepository,
  IdbNoteRepository,
  IdbReminderRepository,
  IdbActivityHistoryRepository,
  IdbSettingsRepository,
  IdbNotificationRepository,
} from "./indexeddb";

// Singleton repository instances
export const contactRepo: IContactRepository = new IdbContactRepository();
export const meetingRepo: IMeetingRepository = new IdbMeetingRepository();
export const followUpRepo: IFollowUpRepository = new IdbFollowUpRepository();
export const noteRepo: INoteRepository = new IdbNoteRepository();
export const reminderRepo: IReminderRepository = new IdbReminderRepository();
export const historyRepo: IActivityHistoryRepository = new IdbActivityHistoryRepository();
export const settingsRepo: ISettingsRepository = new IdbSettingsRepository();
export const notificationRepo: INotificationRepository = new IdbNotificationRepository();
