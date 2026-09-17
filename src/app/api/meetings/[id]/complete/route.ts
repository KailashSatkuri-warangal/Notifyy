import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerActivityService } from "@/services/server/ActivityService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const completed = await ServerActivityService.completeMeeting(session.workspace.id, id);
    return NextResponse.json({ success: true, data: completed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
