import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.userSettings.findUnique({
    where: { workspaceId: session.workspace.id },
  });

  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        workspaceId: session.workspace.id,
        name: session.user.name,
        email: session.user.email,
        mobile: session.user.mobile,
      },
    });
  }

  return NextResponse.json(settings);
}

export async function PATCH(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const updated = await prisma.userSettings.upsert({
      where: { workspaceId: session.workspace.id },
      create: {
        workspaceId: session.workspace.id,
        name: body.name || session.user.name,
        email: body.email || session.user.email,
        mobile: body.mobile || session.user.mobile,
        dailySummaryEnabled: body.dailySummaryEnabled ?? true,
        dailySummaryTime: body.dailySummaryTime || "08:00",
        meetingReminderEnabled: body.meetingReminderEnabled ?? true,
        followUpReminderEnabled: body.followUpReminderEnabled ?? true,
        overdueAlertsEnabled: body.overdueAlertsEnabled ?? true,
        soundEnabled: body.soundEnabled ?? true,
        vibrationEnabled: body.vibrationEnabled ?? true,
        defaultReminder: body.defaultReminder || "1_hour",
        theme: body.theme || "system",
      },
      update: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.email !== undefined ? { email: body.email } : {}),
        ...(body.mobile !== undefined ? { mobile: body.mobile } : {}),
        ...(body.dailySummaryEnabled !== undefined ? { dailySummaryEnabled: body.dailySummaryEnabled } : {}),
        ...(body.dailySummaryTime ? { dailySummaryTime: body.dailySummaryTime } : {}),
        ...(body.meetingReminderEnabled !== undefined ? { meetingReminderEnabled: body.meetingReminderEnabled } : {}),
        ...(body.followUpReminderEnabled !== undefined ? { followUpReminderEnabled: body.followUpReminderEnabled } : {}),
        ...(body.overdueAlertsEnabled !== undefined ? { overdueAlertsEnabled: body.overdueAlertsEnabled } : {}),
        ...(body.soundEnabled !== undefined ? { soundEnabled: body.soundEnabled } : {}),
        ...(body.vibrationEnabled !== undefined ? { vibrationEnabled: body.vibrationEnabled } : {}),
        ...(body.defaultReminder ? { defaultReminder: body.defaultReminder } : {}),
        ...(body.theme ? { theme: body.theme } : {}),
      },
    });

    // If name or mobile updated, also update User table
    if (body.name || body.mobile !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(body.name ? { name: body.name } : {}),
          ...(body.mobile !== undefined ? { mobile: body.mobile } : {}),
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
