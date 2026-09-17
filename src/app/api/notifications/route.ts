import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notifs = await prisma.notification.findMany({
    where: { workspaceId: session.workspace.id },
    orderBy: { timestamp: "desc" },
  });
  return NextResponse.json(notifs);
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const notif = await prisma.notification.create({
      data: {
        workspaceId: session.workspace.id,
        type: body.type || "system",
        title: body.title,
        message: body.message,
        activityId: body.activityId || null,
        activityType: body.activityType || null,
        contactId: body.contactId || null,
        isRead: false,
      },
    });
    return NextResponse.json({ success: true, data: notif });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.updateMany({
    where: { workspaceId: session.workspace.id },
    data: { isRead: true },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.notification.deleteMany({
    where: { workspaceId: session.workspace.id },
  });
  return NextResponse.json({ success: true });
}
