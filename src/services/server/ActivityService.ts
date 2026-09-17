import { prisma } from "@/lib/prisma";
import { calculateReminderTime } from "@/lib/date-utils";
import { ReminderOffset } from "@/types";

export class ServerActivityService {
  // --- MEETINGS ---

  static async getMeetingById(workspaceId: string, meetingId: string) {
    return prisma.meeting.findFirst({
      where: { id: meetingId, workspaceId },
      include: { contact: true },
    });
  }

  static async createMeeting(
    workspaceId: string,
    params: {
      contactId: string;
      title: string;
      date: string;
      time: string;
      location?: string;
      purpose?: string;
      notes?: string;
      reminder: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const meeting = await tx.meeting.create({
        data: {
          workspaceId,
          contactId: params.contactId,
          title: params.title.trim(),
          date: params.date,
          time: params.time,
          location: params.location?.trim() || null,
          purpose: params.purpose?.trim() || null,
          notes: params.notes?.trim() || null,
          reminder: params.reminder,
          status: "pending",
        },
        include: { contact: true },
      });

      if (params.reminder !== "none") {
        const reminderDate = calculateReminderTime(params.date, params.time, params.reminder as ReminderOffset);
        if (reminderDate) {
          await tx.reminder.create({
            data: {
              workspaceId,
              activityType: "meeting",
              activityId: meeting.id,
              contactId: meeting.contactId,
              title: meeting.title,
              reminderTime: reminderDate.toISOString(),
              notificationStatus: "pending",
            },
          });
        }
      }

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: meeting.contactId,
          activityType: "meeting",
          activityId: meeting.id,
          action: "created",
          newData: JSON.stringify({ title: meeting.title, date: meeting.date, time: meeting.time }),
        },
      });

      return meeting;
    });
  }

  static async completeMeeting(workspaceId: string, meetingId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.meeting.findFirst({
        where: { id: meetingId, workspaceId },
        include: { contact: true },
      });
      if (!existing) throw new Error("Meeting not found");

      const now = new Date().toISOString();
      const updated = await tx.meeting.update({
        where: { id: meetingId },
        data: {
          status: "completed",
          completedAt: now,
        },
        include: { contact: true },
      });

      await tx.reminder.deleteMany({
        where: { activityId: meetingId, workspaceId },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: existing.contactId,
          activityType: "meeting",
          activityId: existing.id,
          action: "completed",
        },
      });

      return updated;
    });
  }

  static async rescheduleMeeting(
    workspaceId: string,
    params: {
      id: string;
      newDate: string;
      newTime: string;
      reason?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.meeting.findFirst({
        where: { id: params.id, workspaceId },
      });
      if (!existing) throw new Error("Meeting not found");

      const oldDate = existing.date;
      const oldTime = existing.time;

      const updated = await tx.meeting.update({
        where: { id: params.id },
        data: {
          date: params.newDate,
          time: params.newTime,
          status: "pending",
        },
        include: { contact: true },
      });

      await tx.reminder.deleteMany({
        where: { activityId: params.id, workspaceId },
      });

      if (updated.reminder !== "none") {
        const reminderDate = calculateReminderTime(params.newDate, params.newTime, updated.reminder as ReminderOffset);
        if (reminderDate) {
          await tx.reminder.create({
            data: {
              workspaceId,
              activityType: "meeting",
              activityId: updated.id,
              contactId: updated.contactId,
              title: updated.title,
              reminderTime: reminderDate.toISOString(),
              notificationStatus: "pending",
            },
          });
        }
      }

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: updated.contactId,
          activityType: "meeting",
          activityId: updated.id,
          action: "rescheduled",
          previousData: JSON.stringify({ date: oldDate, time: oldTime }),
          newData: JSON.stringify({ date: params.newDate, time: params.newTime }),
          reason: params.reason || null,
        },
      });

      return updated;
    });
  }

  static async cancelMeeting(workspaceId: string, id: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.meeting.findFirst({
        where: { id, workspaceId },
      });
      if (!existing) throw new Error("Meeting not found");

      const updated = await tx.meeting.update({
        where: { id },
        data: { status: "cancelled" },
      });

      await tx.reminder.deleteMany({
        where: { activityId: id, workspaceId },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: existing.contactId,
          activityType: "meeting",
          activityId: id,
          action: "cancelled",
          reason: reason || null,
        },
      });

      return updated;
    });
  }

  static async deleteMeeting(workspaceId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.reminder.deleteMany({ where: { activityId: id, workspaceId } });
      await tx.activityHistory.deleteMany({ where: { activityId: id, workspaceId } });
      return tx.meeting.deleteMany({ where: { id, workspaceId } });
    });
  }

  // --- FOLLOW-UPS ---

  static async getFollowUpById(workspaceId: string, followUpId: string) {
    return prisma.followUp.findFirst({
      where: { id: followUpId, workspaceId },
      include: { contact: true },
    });
  }

  static async createFollowUp(
    workspaceId: string,
    params: {
      contactId: string;
      title: string;
      date: string;
      time: string;
      notes?: string;
      reminder: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const followUp = await tx.followUp.create({
        data: {
          workspaceId,
          contactId: params.contactId,
          title: params.title.trim(),
          date: params.date,
          time: params.time,
          notes: params.notes?.trim() || null,
          reminder: params.reminder,
          status: "pending",
        },
        include: { contact: true },
      });

      if (params.reminder !== "none") {
        const reminderDate = calculateReminderTime(params.date, params.time, params.reminder as ReminderOffset);
        if (reminderDate) {
          await tx.reminder.create({
            data: {
              workspaceId,
              activityType: "follow_up",
              activityId: followUp.id,
              contactId: followUp.contactId,
              title: followUp.title,
              reminderTime: reminderDate.toISOString(),
              notificationStatus: "pending",
            },
          });
        }
      }

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: followUp.contactId,
          activityType: "follow_up",
          activityId: followUp.id,
          action: "created",
          newData: JSON.stringify({ title: followUp.title, date: followUp.date, time: followUp.time }),
        },
      });

      return followUp;
    });
  }

  static async completeFollowUp(workspaceId: string, followUpId: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.followUp.findFirst({
        where: { id: followUpId, workspaceId },
        include: { contact: true },
      });
      if (!existing) throw new Error("Follow-up not found");

      const now = new Date().toISOString();
      const updated = await tx.followUp.update({
        where: { id: followUpId },
        data: {
          status: "completed",
          completedAt: now,
        },
        include: { contact: true },
      });

      await tx.reminder.deleteMany({
        where: { activityId: followUpId, workspaceId },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: existing.contactId,
          activityType: "follow_up",
          activityId: existing.id,
          action: "completed",
        },
      });

      return updated;
    });
  }

  static async rescheduleFollowUp(
    workspaceId: string,
    params: {
      id: string;
      newDate: string;
      newTime: string;
      reason?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.followUp.findFirst({
        where: { id: params.id, workspaceId },
      });
      if (!existing) throw new Error("Follow-up not found");

      const oldDate = existing.date;
      const oldTime = existing.time;

      const updated = await tx.followUp.update({
        where: { id: params.id },
        data: {
          date: params.newDate,
          time: params.newTime,
          status: "pending",
        },
        include: { contact: true },
      });

      await tx.reminder.deleteMany({
        where: { activityId: params.id, workspaceId },
      });

      if (updated.reminder !== "none") {
        const reminderDate = calculateReminderTime(params.newDate, params.newTime, updated.reminder as ReminderOffset);
        if (reminderDate) {
          await tx.reminder.create({
            data: {
              workspaceId,
              activityType: "follow_up",
              activityId: updated.id,
              contactId: updated.contactId,
              title: updated.title,
              reminderTime: reminderDate.toISOString(),
              notificationStatus: "pending",
            },
          });
        }
      }

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: updated.contactId,
          activityType: "follow_up",
          activityId: updated.id,
          action: "rescheduled",
          previousData: JSON.stringify({ date: oldDate, time: oldTime }),
          newData: JSON.stringify({ date: params.newDate, time: params.newTime }),
          reason: params.reason || null,
        },
      });

      return updated;
    });
  }

  static async deleteFollowUp(workspaceId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.reminder.deleteMany({ where: { activityId: id, workspaceId } });
      await tx.activityHistory.deleteMany({ where: { activityId: id, workspaceId } });
      return tx.followUp.deleteMany({ where: { id, workspaceId } });
    });
  }
}
