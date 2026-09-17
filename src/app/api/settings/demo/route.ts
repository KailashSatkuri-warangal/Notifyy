import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerSeedService } from "@/services/server/SeedService";

export async function POST() {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await ServerSeedService.seedWorkspace(session.workspace.id, session.user.name);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
