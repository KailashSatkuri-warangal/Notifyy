import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerActivityService } from "@/services/server/ActivityService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const rescheduled = await ServerActivityService.rescheduleFollowUp(session.workspace.id, {
      id,
      newDate: body.newDate,
      newTime: body.newTime,
      reason: body.reason,
    });
    return NextResponse.json({ success: true, data: rescheduled });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
