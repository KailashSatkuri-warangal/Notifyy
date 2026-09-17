import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getAuthenticatedSession();
  if (!session) {
    return NextResponse.json({ user: null, workspace: null, settings: null }, { status: 200 });
  }

  const settings = await prisma.userSettings.findUnique({
    where: { workspaceId: session.workspace.id },
  });

  return NextResponse.json({
    user: session.user,
    workspace: session.workspace,
    settings,
  });
}
