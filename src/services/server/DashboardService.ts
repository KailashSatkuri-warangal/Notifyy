import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export interface DashboardSummary {
  stats: {
    todayMeetings: number;
    todayFollowUps: number;
    overdueActivities: number;
    completedToday: number;
    upcomingActivities: number;
  };
  todayTimeline: Array<{
    id: string;
    type: "meeting" | "follow_up";
    contactId: string;
    contactName: string;
    contactCompany: string;
    contactMobile: string;
    title: string;
    date: string;
    time: string;
    location?: string | null;
    purpose?: string | null;
    notes?: string | null;
    reminder: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  overdueList: Array<{
    id: string;
    type: "meeting" | "follow_up";
    contactId: string;
    contactName: string;
    contactCompany: string;
    contactMobile: string;
    title: string;
    date: string;
    time: string;
    status: string;
  }>;
}

export class ServerDashboardService {
  static async getDashboardSummary(workspaceId: string, clientDate?: string): Promise<DashboardSummary> {
    const today = clientDate || format(new Date(), "yyyy-MM-dd");
    const currentTime = format(new Date(), "HH:mm");

    const [allMeetings, allFollowUps] = await Promise.all([
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
    ]);

    const isActivityOverdue = (date: string, time: string, status: string) => {
      if (status === "completed" || status === "cancelled" || status === "rescheduled") {
        return false;
      }
      if (date < today) return true;
      if (date === today && time < currentTime) return true;
      return false;
    };

    const todayMeetingsList = allMeetings.filter((m) => m.date === today && m.status !== "cancelled");
    const todayFollowUpsList = allFollowUps.filter((f) => f.date === today && f.status !== "cancelled");
    
    const overdueMeetings = allMeetings.filter((m) => isActivityOverdue(m.date, m.time, m.status));
    const overdueFollowUps = allFollowUps.filter((f) => isActivityOverdue(f.date, f.time, f.status));
    const totalOverdue = overdueMeetings.length + overdueFollowUps.length;

    const completedTodayMeetings = allMeetings.filter((m) => m.status === "completed" && m.date === today);
    const completedTodayFollowUps = allFollowUps.filter((f) => f.status === "completed" && f.date === today);
    const totalCompletedToday = completedTodayMeetings.length + completedTodayFollowUps.length;

    const upcomingMeetings = allMeetings.filter((m) => m.date > today && m.status === "pending");
    const upcomingFollowUps = allFollowUps.filter((f) => f.date > today && f.status === "pending");
    const totalUpcoming = upcomingMeetings.length + upcomingFollowUps.length;

    const todayTimeline = [
      ...todayMeetingsList.map((m) => ({
        id: m.id,
        type: "meeting" as const,
        contactId: m.contactId,
        contactName: m.contact?.name || "Unknown",
        contactCompany: m.contact?.company || "",
        contactMobile: m.contact?.mobile || "",
        title: m.title,
        date: m.date,
        time: m.time,
        location: m.location,
        purpose: m.purpose,
        notes: m.notes,
        reminder: m.reminder,
        status: isActivityOverdue(m.date, m.time, m.status) ? "overdue" : m.status,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
      ...todayFollowUpsList.map((f) => ({
        id: f.id,
        type: "follow_up" as const,
        contactId: f.contactId,
        contactName: f.contact?.name || "Unknown",
        contactCompany: f.contact?.company || "",
        contactMobile: f.contact?.mobile || "",
        title: f.title,
        date: f.date,
        time: f.time,
        location: null,
        purpose: null,
        notes: f.notes,
        reminder: f.reminder,
        status: isActivityOverdue(f.date, f.time, f.status) ? "overdue" : f.status,
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
    ].sort((a, b) => a.time.localeCompare(b.time));

    const overdueList = [
      ...overdueMeetings.map((m) => ({
        id: m.id,
        type: "meeting" as const,
        contactId: m.contactId,
        contactName: m.contact?.name || "Unknown",
        contactCompany: m.contact?.company || "",
        contactMobile: m.contact?.mobile || "",
        title: m.title,
        date: m.date,
        time: m.time,
        status: "overdue",
      })),
      ...overdueFollowUps.map((f) => ({
        id: f.id,
        type: "follow_up" as const,
        contactId: f.contactId,
        contactName: f.contact?.name || "Unknown",
        contactCompany: f.contact?.company || "",
        contactMobile: f.contact?.mobile || "",
        title: f.title,
        date: f.date,
        time: f.time,
        status: "overdue",
      })),
    ].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    return {
      stats: {
        todayMeetings: todayMeetingsList.length,
        todayFollowUps: todayFollowUpsList.length,
        overdueActivities: totalOverdue,
        completedToday: totalCompletedToday,
        upcomingActivities: totalUpcoming,
      },
      todayTimeline,
      overdueList,
    };
  }
}
