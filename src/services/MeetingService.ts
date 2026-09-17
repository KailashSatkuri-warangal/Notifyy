import { Meeting, ReminderOffset, ActivityStatus } from "@/types";
import { IMeetingRepository } from "@/repositories/interfaces";
import { meetingRepo } from "@/repositories";
import { generateId } from "@/lib/utils";
import { reminderService } from "./ReminderService";
import { activityHistoryService } from "./ActivityHistoryService";
import { StatusEngine } from "./StatusEngine";

export class MeetingService {
  constructor(private repo: IMeetingRepository = meetingRepo) {}

  async getAllMeetings(): Promise<Meeting[]> {
    const meetings = await this.repo.getAll();
    return meetings.map((m) => ({
      ...m,
      status: StatusEngine.evaluateStatus(m.date, m.time, m.status),
    }));
  }

  async getMeetingById(id: string): Promise<Meeting | undefined> {
    const meeting = await this.repo.getById(id);
    if (!meeting) return undefined;
    return {
      ...meeting,
      status: StatusEngine.evaluateStatus(meeting.date, meeting.time, meeting.status),
    };
  }

  async getMeetingsByContact(contactId: string): Promise<Meeting[]> {
    const meetings = await this.repo.getByContactId(contactId);
    return meetings.map((m) => ({
      ...m,
      status: StatusEngine.evaluateStatus(m.date, m.time, m.status),
    }));
  }

  async createMeeting(params: {
    contactId: string;
    title: string;
    date: string;
    time: string;
    location?: string;
    purpose?: string;
    notes?: string;
    reminder: ReminderOffset;
  }): Promise<Meeting> {
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: generateId(),
      contactId: params.contactId,
      title: params.title.trim(),
      date: params.date,
      time: params.time,
      location: params.location?.trim() || undefined,
      purpose: params.purpose?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      reminder: params.reminder,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };

    const created = await this.repo.create(meeting);

    // Schedule reminder
    await reminderService.createOrUpdateReminder({
      activityType: "meeting",
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
      activityType: "meeting",
      activityId: created.id,
      action: "created",
      newData: { title: created.title, date: created.date, time: created.time },
    });

    return created;
  }

  async updateMeeting(meeting: Meeting): Promise<Meeting> {
    meeting.updatedAt = new Date().toISOString();
    const updated = await this.repo.update(meeting);

    await reminderService.createOrUpdateReminder({
      activityType: "meeting",
      activityId: updated.id,
      contactId: updated.contactId,
      title: updated.title,
      date: updated.date,
      time: updated.time,
      reminderOffset: updated.reminder,
    });

    await activityHistoryService.log({
      contactId: updated.contactId,
      activityType: "meeting",
      activityId: updated.id,
      action: "edited",
      newData: { title: updated.title, date: updated.date, time: updated.time },
    });

    return updated;
  }

  async completeMeeting(id: string): Promise<Meeting | undefined> {
    const meeting = await this.repo.getById(id);
    if (!meeting) return undefined;

    const now = new Date().toISOString();
    meeting.status = "completed";
    meeting.completedAt = now;
    meeting.updatedAt = now;

    await this.repo.update(meeting);
    await reminderService.cancelRemindersForActivity(id);

    await activityHistoryService.log({
      contactId: meeting.contactId,
      activityType: "meeting",
      activityId: meeting.id,
      action: "completed",
    });

    return meeting;
  }

  async rescheduleMeeting(params: {
    id: string;
    newDate: string;
    newTime: string;
    reason?: string;
  }): Promise<Meeting | undefined> {
    const meeting = await this.repo.getById(params.id);
    if (!meeting) return undefined;

    const oldDate = meeting.date;
    const oldTime = meeting.time;
    const now = new Date().toISOString();

    meeting.date = params.newDate;
    meeting.time = params.newTime;
    meeting.status = "pending";
    meeting.updatedAt = now;

    await this.repo.update(meeting);

    // Reschedule reminder
    await reminderService.createOrUpdateReminder({
      activityType: "meeting",
      activityId: meeting.id,
      contactId: meeting.contactId,
      title: meeting.title,
      date: meeting.date,
      time: meeting.time,
      reminderOffset: meeting.reminder,
    });

    // Log reschedule history with old vs new date
    await activityHistoryService.log({
      contactId: meeting.contactId,
      activityType: "meeting",
      activityId: meeting.id,
      action: "rescheduled",
      previousData: { date: oldDate, time: oldTime },
      newData: { date: params.newDate, time: params.newTime },
      reason: params.reason,
    });

    return meeting;
  }

  async cancelMeeting(id: string, reason?: string): Promise<Meeting | undefined> {
    const meeting = await this.repo.getById(id);
    if (!meeting) return undefined;

    meeting.status = "cancelled";
    meeting.updatedAt = new Date().toISOString();

    await this.repo.update(meeting);
    await reminderService.cancelRemindersForActivity(id);

    await activityHistoryService.log({
      contactId: meeting.contactId,
      activityType: "meeting",
      activityId: meeting.id,
      action: "cancelled",
      reason,
    });

    return meeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    const meeting = await this.repo.getById(id);
    if (meeting) {
      await reminderService.cancelRemindersForActivity(id);
      await this.repo.delete(id);
    }
  }
}

export const meetingService = new MeetingService();
