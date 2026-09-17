import { ReminderOffset, Reminder, ActivityType } from "@/types";
import { IReminderRepository } from "@/repositories/interfaces";
import { reminderRepo } from "@/repositories";
import { calculateReminderTime } from "@/lib/date-utils";
import { generateId } from "@/lib/utils";

export class ReminderService {
  constructor(private repo: IReminderRepository = reminderRepo) {}

  async createOrUpdateReminder(params: {
    activityType: ActivityType;
    activityId: string;
    contactId: string;
    title: string;
    date: string;
    time: string;
    reminderOffset: ReminderOffset;
  }): Promise<Reminder | null> {
    // 1. Delete existing reminders for this activity
    await this.repo.deleteByActivityId(params.activityId);

    // 2. If offset is none, return null
    if (params.reminderOffset === "none") {
      return null;
    }

    // 3. Calculate reminder timestamp
    const reminderDate = calculateReminderTime(params.date, params.time, params.reminderOffset);
    if (!reminderDate) {
      return null;
    }

    const now = new Date();
    // Only schedule if reminder is in the future or within recent past
    const reminder: Reminder = {
      id: generateId(),
      activityType: params.activityType,
      activityId: params.activityId,
      contactId: params.contactId,
      title: params.title,
      reminderTime: reminderDate.toISOString(),
      notificationStatus: "pending",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    return this.repo.create(reminder);
  }

  async cancelRemindersForActivity(activityId: string): Promise<void> {
    await this.repo.deleteByActivityId(activityId);
  }

  async getPendingReminders(): Promise<Reminder[]> {
    const now = new Date().toISOString();
    return this.repo.getPendingReminders(now);
  }

  async markAsSent(reminderId: string): Promise<void> {
    const reminder = await this.repo.getById(reminderId);
    if (reminder) {
      reminder.notificationStatus = "sent";
      reminder.updatedAt = new Date().toISOString();
      await this.repo.update(reminder);
    }
  }
}

export const reminderService = new ReminderService();
