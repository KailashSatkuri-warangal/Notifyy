import { prisma } from "@/lib/prisma";
import { format, subDays, addDays } from "date-fns";
import { getAvatarColor } from "@/lib/utils";

export class ServerSeedService {
  static async seedWorkspace(workspaceId: string, userName?: string) {
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const twoDaysAgo = format(subDays(new Date(), 2), "yyyy-MM-dd");
    const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
    const nextWeek = format(addDays(new Date(), 5), "yyyy-MM-dd");

    return prisma.$transaction(async (tx) => {
      await tx.activityHistory.deleteMany({ where: { workspaceId } });
      await tx.reminder.deleteMany({ where: { workspaceId } });
      await tx.notification.deleteMany({ where: { workspaceId } });
      await tx.note.deleteMany({ where: { workspaceId } });
      await tx.meeting.deleteMany({ where: { workspaceId } });
      await tx.followUp.deleteMany({ where: { workspaceId } });
      await tx.contact.deleteMany({ where: { workspaceId } });

      const existingSettings = await tx.userSettings.findUnique({ where: { workspaceId } });
      if (!existingSettings) {
        await tx.userSettings.create({
          data: {
            workspaceId,
            name: userName || "Alex Morgan",
            mobile: "+91 98765 43210",
            email: "alex@notifyy.app",
            dailySummaryEnabled: true,
            dailySummaryTime: "08:00",
            meetingReminderEnabled: true,
            followUpReminderEnabled: true,
            overdueAlertsEnabled: true,
            soundEnabled: true,
            vibrationEnabled: true,
            defaultReminder: "1_hour",
            theme: "system",
          },
        });
      }

      const rajesh = await tx.contact.create({
        data: {
          workspaceId,
          name: "Rajesh Kumar",
          company: "ABC Industries",
          mobile: "+91 98201 45678",
          email: "rajesh.kumar@abcindustries.com",
          address: "Bandra Kurla Complex, Mumbai, MH",
          notes: "Key decision maker for enterprise ERP rollout. Prefers morning calls.",
          avatarColor: getAvatarColor("Rajesh Kumar"),
          lastContactedAt: yesterday,
        },
      });

      const priya = await tx.contact.create({
        data: {
          workspaceId,
          name: "Priya Sharma",
          company: "XYZ Solutions",
          mobile: "+91 98112 34567",
          email: "priya.s@xyzsolutions.in",
          address: "Indiranagar, Bengaluru, KA",
          notes: "VP of Product. Interested in our Q3 custom integration proposal.",
          avatarColor: getAvatarColor("Priya Sharma"),
          lastContactedAt: twoDaysAgo,
        },
      });

      const suresh = await tx.contact.create({
        data: {
          workspaceId,
          name: "Suresh Rao",
          company: "Tech Corp International",
          mobile: "+91 98450 98765",
          email: "suresh.rao@techcorpglobal.com",
          address: "HITEC City, Hyderabad, TS",
          notes: "CTO. Reviewing annual SLA contracts and cloud migration budget.",
          avatarColor: getAvatarColor("Suresh Rao"),
        },
      });

      const anil = await tx.contact.create({
        data: {
          workspaceId,
          name: "Anil Kumar",
          company: "ABC Industries",
          mobile: "+91 98334 11223",
          email: "anil.k@abcindustries.com",
          address: "Bandra Kurla Complex, Mumbai, MH",
          notes: "Head of Procurement. Handles vendor onboarding and invoice processing.",
          avatarColor: getAvatarColor("Anil Kumar"),
          lastContactedAt: yesterday,
        },
      });

      const deepika = await tx.contact.create({
        data: {
          workspaceId,
          name: "Deepika Patel",
          company: "Nexus Global Logistics",
          mobile: "+91 99099 87654",
          email: "deepika.patel@nexusglobal.com",
          address: "Navrangpura, Ahmedabad, GJ",
          notes: "COO. Looking for warehouse dispatch tracking alerts.",
          avatarColor: getAvatarColor("Deepika Patel"),
        },
      });

      await tx.meeting.create({
        data: {
          workspaceId,
          contactId: rajesh.id,
          title: "Quarterly Strategy & ERP Scope Discussion",
          date: today,
          time: "09:00",
          location: "ABC Industries HQ, Bandra / Google Meet",
          purpose: "Finalize module roadmap and approve milestones for Q4 release.",
          notes: "Bring updated presentation deck and revised pricing structure.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.meeting.create({
        data: {
          workspaceId,
          contactId: suresh.id,
          title: "Technical Architecture Review",
          date: today,
          time: "14:00",
          location: "Zoom Video Conference",
          purpose: "Deep-dive with Suresh and lead security architect.",
          notes: "Send security compliance whitepaper 30 mins before call.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.meeting.create({
        data: {
          workspaceId,
          contactId: deepika.id,
          title: "Dispatch Automation Demo",
          date: tomorrow,
          time: "11:00",
          location: "Microsoft Teams",
          purpose: "Demonstrate live webhook alerts & shipment tracking.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.followUp.create({
        data: {
          workspaceId,
          contactId: priya.id,
          title: "Send revised proposal with tiered SaaS discounts",
          date: today,
          time: "11:30",
          notes: "Priya requested a 15% discount breakdown for 100+ seats.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.followUp.create({
        data: {
          workspaceId,
          contactId: anil.id,
          title: "Confirm GST billing details and purchase order approval",
          date: today,
          time: "16:30",
          notes: "Ensure vendor onboarding packet is signed by finance team.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.followUp.create({
        data: {
          workspaceId,
          contactId: rajesh.id,
          title: "Follow up on IT security questionnaire signoff",
          date: twoDaysAgo,
          time: "11:00",
          notes: "Overdue follow-up requiring immediate call to Rajesh.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.followUp.create({
        data: {
          workspaceId,
          contactId: suresh.id,
          title: "Confirm cloud benchmark testing sandbox credentials",
          date: nextWeek,
          time: "14:30",
          notes: "Setup temporary staging keys for tech evaluation team.",
          reminder: "1_hour",
          status: "pending",
        },
      });

      await tx.note.create({
        data: {
          workspaceId,
          contactId: rajesh.id,
          activityType: "meeting",
          note: "Rajesh confirmed their board approved budget for the new system. Expecting contract signing by end of month.",
        },
      });

      await tx.note.create({
        data: {
          workspaceId,
          contactId: priya.id,
          activityType: "call",
          note: "Spoke with Priya on phone. Requested volume tier pricing for 50, 100, and 250 user bands.",
        },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: rajesh.id,
          activityType: "contact",
          activityId: rajesh.id,
          action: "created",
        },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: rajesh.id,
          activityType: "call",
          activityId: "call_1",
          action: "called",
        },
      });

      await tx.notification.create({
        data: {
          workspaceId,
          type: "daily_summary",
          title: "Good Morning Briefing",
          message: "You have 2 meetings and 2 follow-ups scheduled for today, plus 1 overdue item.",
          isRead: false,
        },
      });
    });
  }
}
