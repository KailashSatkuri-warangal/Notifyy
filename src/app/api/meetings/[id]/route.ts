import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerActivityService } from "@/services/server/ActivityService";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const meeting = await ServerActivityService.getMeetingById(session.workspace.id, id);
  if (!meeting) return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  return NextResponse.json(meeting);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await ServerActivityService.deleteMeeting(session.workspace.id, id);
  return NextResponse.json({ success: true });
}
