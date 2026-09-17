import { FollowUp, ReminderOffset, ActivityStatus } from "@/types";
import { IFollowUpRepository } from "@/repositories/interfaces";
import { followUpRepo } from "@/repositories";
import { generateId } from "@/lib/utils";
import { reminderService } from "./ReminderService";
import { activityHistoryService } from "./ActivityHistoryService";
import { StatusEngine } from "./StatusEngine";

export class FollowUpService {
  constructor(private repo: IFollowUpRepository = followUpRepo) {}

  async getAllFollowUps(): Promise<FollowUp[]> {
    const followUps = await this.repo.getAll();
    return followUps.map((f) => ({
      ...f,
      status: StatusEngine.evaluateStatus(f.date, f.time, f.status),
    }));
  }

  async getFollowUpById(id: string): Promise<FollowUp | undefined> {
    const followUp = await this.repo.getById(id);
    if (!followUp) return undefined;
    return {
      ...followUp,
      status: StatusEngine.evaluateStatus(followUp.date, followUp.time, followUp.status),
    };
  }

  async getFollowUpsByContact(contactId: string): Promise<FollowUp[]> {
    const followUps = await this.repo.getByContactId(contactId);
    return followUps.map((f) => ({
      ...f,
      status: StatusEngine.evaluateStatus(f.date, f.time, f.status),
    }));
  }

  async createFollowUp(params: {
    contactId: string;
    title: string;
    date: string;
    time: string;
    notes?: string;
    reminder: ReminderOffset;
  }): Promise<FollowUp> {
    const now = new Date().toISOString();
    const followUp: FollowUp = {
      id: generateId(),
      contactId: params.contactId,
      title: params.title.trim(),
      date: params.date,
      time: params.time,
      notes: params.notes?.trim() || undefined,
      reminder: params.reminder,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.create(followUp);

    // Schedule reminder
    await reminderService.createOrUpdateReminder({
      activityType: "follow_up",
      activityId: created.id,
      contactId: created.contactId,
      title: created.title,
      date: created.date,
      time: created.time,
      reminderOffset: created.reminder,
    });

    // Log history
    await activityHistoryService.log({
      contactId: created.contactId,
      activityType: "follow_up",
      activityId: created.id,
      action: "created",
      newData: { title: created.title, date: created.date, time: created.time },
    });

    return created;
  }

  async updateFollowUp(followUp: FollowUp): Promise<FollowUp> {
    followUp.updatedAt = new Date().toISOString();
    const updated = await this.repo.update(followUp);

    await reminderService.createOrUpdateReminder({
      activityType: "follow_up",
      activityId: updated.id,
      contactId: updated.contactId,
      title: updated.title,
      date: updated.date,
      time: updated.time,
      reminderOffset: updated.reminder,
    });

    await activityHistoryService.log({
      contactId: updated.contactId,
      activityType: "follow_up",
      activityId: updated.id,
      action: "edited",
      newData: { title: updated.title, date: updated.date, time: updated.time },
    });

    return updated;
  }

  async completeFollowUp(id: string): Promise<FollowUp | undefined> {
    const followUp = await this.repo.getById(id);
    if (!followUp) return undefined;

    const now = new Date().toISOString();
    followUp.status = "completed";
    followUp.completedAt = now;
    followUp.updatedAt = now;

    await this.repo.update(followUp);
    await reminderService.cancelRemindersForActivity(id);

    await activityHistoryService.log({
      contactId: followUp.contactId,
      activityType: "follow_up",
      activityId: followUp.id,
      action: "completed",
    });

    return followUp;
  }

  async rescheduleFollowUp(params: {
    id: string;
    newDate: string;
    newTime: string;
    reason?: string;
  }): Promise<FollowUp | undefined> {
    const followUp = await this.repo.getById(params.id);
    if (!followUp) return undefined;

    const oldDate = followUp.date;
    const oldTime = followUp.time;
    const now = new Date().toISOString();

    followUp.date = params.newDate;
    followUp.time = params.newTime;
    followUp.status = "pending";
    followUp.updatedAt = now;

    await this.repo.update(followUp);

    await reminderService.createOrUpdateReminder({
      activityType: "follow_up",
      activityId: followUp.id,
      contactId: followUp.contactId,
      title: followUp.title,
      date: followUp.date,
      time: followUp.time,
      reminderOffset: followUp.reminder,
    });

    await activityHistoryService.log({
      contactId: followUp.contactId,
      activityType: "follow_up",
      activityId: followUp.id,
      action: "rescheduled",
      previousData: { date: oldDate, time: oldTime },
      newData: { date: params.newDate, time: params.newTime },
      reason: params.reason,
    });

    return followUp;
  }

  async cancelFollowUp(id: string, reason?: string): Promise<FollowUp | undefined> {
    const followUp = await this.repo.getById(id);
    if (!followUp) return undefined;

    followUp.status = "cancelled";
    followUp.updatedAt = new Date().toISOString();

    await this.repo.update(followUp);
    await reminderService.cancelRemindersForActivity(id);

    await activityHistoryService.log({
      contactId: followUp.contactId,
      activityType: "follow_up",
      activityId: followUp.id,
      action: "cancelled",
      reason,
    });

    return followUp;
  }

  async deleteFollowUp(id: string): Promise<void> {
    const followUp = await this.repo.getById(id);
    if (followUp) {
      await reminderService.cancelRemindersForActivity(id);
      await this.repo.delete(id);
    }
  }
}

export const followUpService = new FollowUpService();
