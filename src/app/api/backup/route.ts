import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [contacts, meetings, followUps, notes, reminders, history, notifications, settings] =
    await Promise.all([
      prisma.contact.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.meeting.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.followUp.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.note.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.reminder.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.activityHistory.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.notification.findMany({ where: { workspaceId: session.workspace.id } }),
      prisma.userSettings.findUnique({ where: { workspaceId: session.workspace.id } }),
    ]);

  const backupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    workspaceName: session.workspace.name,
    contacts,
    meetings,
    followUps,
    notes,
    reminders,
    history,
    notifications,
    settings,
  };

  return NextResponse.json(backupData);
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: backupData, mode } = await req.json();
    if (!backupData || !Array.isArray(backupData.contacts)) {
      return NextResponse.json({ error: "Invalid backup data format" }, { status: 400 });
    }

    const wsId = session.workspace.id;

    await prisma.$transaction(async (tx) => {
      if (mode === "replace") {
        await tx.activityHistory.deleteMany({ where: { workspaceId: wsId } });
        await tx.reminder.deleteMany({ where: { workspaceId: wsId } });
        await tx.notification.deleteMany({ where: { workspaceId: wsId } });
        await tx.note.deleteMany({ where: { workspaceId: wsId } });
        await tx.meeting.deleteMany({ where: { workspaceId: wsId } });
        await tx.followUp.deleteMany({ where: { workspaceId: wsId } });
        await tx.contact.deleteMany({ where: { workspaceId: wsId } });
      }

      // Map contact IDs to new or preserved IDs
      for (const c of backupData.contacts) {
        await tx.contact.upsert({
          where: { id: c.id },
          create: {
            id: c.id,
            workspaceId: wsId,
            name: c.name,
            company: c.company,
            mobile: c.mobile,
            email: c.email || null,
            address: c.address || null,
            notes: c.notes || null,
            avatarColor: c.avatarColor || null,
            isArchived: c.isArchived ?? false,
            lastContactedAt: c.lastContactedAt || null,
          },
          update: {
            name: c.name,
            company: c.company,
            mobile: c.mobile,
            email: c.email || null,
            address: c.address || null,
            notes: c.notes || null,
          },
        });
      }

      for (const m of backupData.meetings || []) {
        await tx.meeting.upsert({
          where: { id: m.id },
          create: {
            id: m.id,
            workspaceId: wsId,
            contactId: m.contactId,
            title: m.title,
            date: m.date,
            time: m.time,
            location: m.location || null,
            purpose: m.purpose || null,
            notes: m.notes || null,
            reminder: m.reminder || "1_hour",
            status: m.status || "pending",
            completedAt: m.completedAt || null,
          },
          update: {
            title: m.title,
            date: m.date,
            time: m.time,
            status: m.status || "pending",
          },
        });
      }

      for (const f of backupData.followUps || []) {
        await tx.followUp.upsert({
          where: { id: f.id },
          create: {
            id: f.id,
            workspaceId: wsId,
            contactId: f.contactId,
            title: f.title,
            date: f.date,
            time: f.time,
            notes: f.notes || null,
            reminder: f.reminder || "1_hour",
            status: f.status || "pending",
            completedAt: f.completedAt || null,
          },
          update: {
            title: f.title,
            date: f.date,
            time: f.time,
            status: f.status || "pending",
          },
        });
      }

      for (const n of backupData.notes || []) {
        await tx.note.upsert({
          where: { id: n.id },
          create: {
            id: n.id,
            workspaceId: wsId,
            contactId: n.contactId,
            meetingId: n.meetingId || null,
            followUpId: n.followUpId || null,
            activityType: n.activityType || "general",
            note: n.note,
          },
          update: { note: n.note },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Restore error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
