import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerDashboardService } from "@/services/server/DashboardService";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const clientDate = searchParams.get("date") || undefined;

  const summary = await ServerDashboardService.getDashboardSummary(session.workspace.id, clientDate);
  return NextResponse.json(summary);
}
