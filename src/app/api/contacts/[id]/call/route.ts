import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerContactService } from "@/services/server/ContactService";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await ServerContactService.recordCall(session.workspace.id, id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
