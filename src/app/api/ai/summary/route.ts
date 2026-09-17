import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerAISummaryService } from "@/services/server/AISummaryService";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");

  if (!contactId) {
    return NextResponse.json({ error: "contactId is required" }, { status: 400 });
  }

  try {
    const summary = await ServerAISummaryService.generateContactSummary(
      session.workspace.id,
      contactId
    );
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
