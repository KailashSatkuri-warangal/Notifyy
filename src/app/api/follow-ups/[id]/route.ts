import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerActivityService } from "@/services/server/ActivityService";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const followUp = await ServerActivityService.getFollowUpById(session.workspace.id, id);
  if (!followUp) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });

  return NextResponse.json(followUp);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await ServerActivityService.deleteFollowUp(session.workspace.id, id);
  return NextResponse.json({ success: true });
}
