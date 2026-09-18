import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const nowIso = new Date().toISOString();

    // 1. Fetch pending reminders due up to current time
    const dueReminders = await prisma.reminder.findMany({
      where: {
        notificationStatus: "pending",
        reminderTime: { lte: nowIso },
      },
      take: 50,
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "No pending reminders due" });
    }

    let processedCount = 0;

    for (const rem of dueReminders) {
      // Check if activity is still active (not completed or cancelled)
      let isActive = true;
      if (rem.activityType === "meeting") {
        const m = await prisma.meeting.findUnique({ where: { id: rem.activityId } });
        if (!m || m.status === "completed" || m.status === "cancelled") isActive = false;
      } else if (rem.activityType === "follow_up") {
        const f = await prisma.followUp.findUnique({ where: { id: rem.activityId } });
        if (!f || f.status === "completed" || f.status === "cancelled") isActive = false;
      }

      if (!isActive) {
        await prisma.reminder.update({
          where: { id: rem.id },
          data: { notificationStatus: "dismissed" },
        });
        continue;
      }

      await prisma.$transaction(async (tx) => {
        // Create in-app notification record
        await tx.notification.create({
          data: {
            workspaceId: rem.workspaceId,
            type: rem.activityType === "meeting" ? "meeting_reminder" : "followup_reminder",
            title: `⏰ Due: ${rem.title}`,
            message: `Scheduled ${rem.activityType === "meeting" ? "Meeting" : "Follow-Up"} reminder triggered.`,
            activityId: rem.activityId,
            activityType: rem.activityType,
            contactId: rem.contactId,
            isRead: false,
          },
        });

        // Mark reminder as sent
        await tx.reminder.update({
          where: { id: rem.id },
          data: {
            notificationStatus: "sent",
          },
        });
      });

      processedCount++;
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      timestamp: nowIso,
    });
  } catch (error: any) {
    console.error("Cron reminder error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process cron reminders" },
      { status: 500 }
    );
  }
}
