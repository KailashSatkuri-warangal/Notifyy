import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ServerContactService } from "@/services/server/ContactService";
import { ServerNoteService } from "@/services/server/NoteService";
import { ServerDashboardService } from "@/services/server/DashboardService";

export async function GET(req: Request) {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        user: null,
        workspace: null,
        settings: null,
        contacts: [],
        meetings: [],
        followUps: [],
        notes: [],
        notifications: [],
        dashboardStats: {
          todayMeetings: 0,
          todayFollowUps: 0,
          overdueActivities: 0,
          completedToday: 0,
          upcomingActivities: 0,
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const clientDate = searchParams.get("date") || undefined;
    const workspaceId = session.workspace.id;

    // Fetch all workspace collections in parallel with a single server dispatch
    const [
      settings,
      contacts,
      meetings,
      followUps,
      notes,
      notifications,
      dashboardSummary,
    ] = await Promise.all([
      prisma.userSettings.findUnique({
        where: { workspaceId },
      }),
      ServerContactService.getContacts(workspaceId),
      prisma.meeting.findMany({
        where: { workspaceId },
        include: { contact: true },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      prisma.followUp.findMany({
        where: { workspaceId },
        include: { contact: true },
        orderBy: [{ date: "asc" }, { time: "asc" }],
      }),
      ServerNoteService.getNotes(workspaceId),
      prisma.notification.findMany({
        where: { workspaceId },
        orderBy: { timestamp: "desc" },
        take: 50,
      }),
      ServerDashboardService.getDashboardSummary(workspaceId, clientDate),
    ]);

    return NextResponse.json({
      authenticated: true,
      user: session.user,
      workspace: session.workspace,
      settings,
      contacts,
      meetings,
      followUps,
      notes,
      notifications,
      dashboardStats: dashboardSummary.stats,
    });
  } catch (error: any) {
    console.error("Bootstrap API error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to bootstrap app data" },
      { status: 500 }
    );
  }
}
