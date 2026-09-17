import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ServerActivityService } from "@/services/server/ActivityService";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const followUps = await prisma.followUp.findMany({
    where: { workspaceId: session.workspace.id },
    include: { contact: true },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return NextResponse.json(followUps);
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.contactId || !body.title || !body.date || !body.time) {
      return NextResponse.json({ error: "Contact, title, date, and time are required" }, { status: 400 });
    }

    const followUp = await ServerActivityService.createFollowUp(session.workspace.id, body);
    return NextResponse.json({ success: true, data: followUp });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
