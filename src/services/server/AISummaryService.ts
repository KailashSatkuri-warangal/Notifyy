import { prisma } from "@/lib/prisma";

export interface ContactAISummary {
  healthStatus: "excellent" | "warm" | "needs_attention" | "new_lead";
  healthScore: number;
  headline: string;
  summary: string;
  commitments: string[];
  suggestedNextStep: {
    action: string;
    topic: string;
    recommendedTimeframe: string;
  };
  talkingPoints: string[];
  generatedAt: string;
}

export class ServerAISummaryService {
  static async generateContactSummary(
    workspaceId: string,
    contactId: string
  ): Promise<ContactAISummary> {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      include: {
        meetings: { orderBy: [{ date: "desc" }, { time: "desc" }] },
        followUps: { orderBy: [{ date: "desc" }, { time: "desc" }] },
        notesList: { orderBy: { createdAt: "desc" } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    const totalInteractions = contact.history.length;
    const completedActivities =
      contact.meetings.filter((m) => m.status === "completed").length +
      contact.followUps.filter((f) => f.status === "completed").length;
    const pendingMeetings = contact.meetings.filter((m) => m.status === "pending");
    const pendingFollowUps = contact.followUps.filter((f) => f.status === "pending");
    const notesCount = contact.notesList.length;

    // Check overdue items
    const now = new Date();
    const hasOverdue =
      pendingMeetings.some((m) => new Date(`${m.date}T${m.time}`) < now) ||
      pendingFollowUps.some((f) => new Date(`${f.date}T${f.time}`) < now);

    // Calculate Health Score
    let healthScore = 70;
    if (totalInteractions > 4) healthScore += 15;
    if (completedActivities > 2) healthScore += 10;
    if (hasOverdue) healthScore -= 25;
    if (!contact.lastContactedAt && totalInteractions <= 1) healthScore = 50;
    healthScore = Math.max(10, Math.min(100, healthScore));

    let healthStatus: ContactAISummary["healthStatus"] = "warm";
    if (hasOverdue || healthScore < 50) {
      healthStatus = "needs_attention";
    } else if (healthScore >= 85) {
      healthStatus = "excellent";
    } else if (totalInteractions <= 1) {
      healthStatus = "new_lead";
    }

    // Extract commitments from notes and titles
    const commitments: string[] = [];
    const notesText = contact.notesList.map((n) => n.note).join(" ");
    const backgroundNotes = contact.notes || "";
    const combinedNotes = `${backgroundNotes} ${notesText}`.toLowerCase();

    if (combinedNotes.includes("quotation") || combinedNotes.includes("pricing") || combinedNotes.includes("quote")) {
      commitments.push("Review and discuss customized commercial quotation");
    }
    if (combinedNotes.includes("discount") || combinedNotes.includes("seats") || combinedNotes.includes("license")) {
      commitments.push("Provide volume pricing breakdown based on requirements");
    }
    if (combinedNotes.includes("demo") || combinedNotes.includes("trial") || combinedNotes.includes("erp")) {
      commitments.push("Schedule technical walkthrough / solution demonstration");
    }
    if (commitments.length === 0) {
      commitments.push(`Maintain regular cadence with ${contact.name}`);
      commitments.push(`Address ${contact.company}'s upcoming milestones`);
    }

    // Headline & Summary
    let headline = `${contact.name} at ${contact.company}`;
    let summary = "";

    if (healthStatus === "needs_attention") {
      headline = `Attention Required: Pending touchpoints with ${contact.name}`;
      summary = `${contact.name} (${contact.company}) has pending follow-ups that have passed scheduled timing. Re-establishing contact promptly will prevent deal momentum loss.`;
    } else if (healthStatus === "excellent") {
      headline = `Strong Momentum: Active relationship with ${contact.company}`;
      summary = `High engagement with ${contact.name}. You have logged ${totalInteractions} total interactions and completed ${completedActivities} scheduled activities. Communication is consistent and on schedule.`;
    } else if (healthStatus === "new_lead") {
      headline = `New Lead Onboarding: ${contact.name}`;
      summary = `Initial contact recorded for ${contact.company}. Prioritize qualifying their immediate timeline and decision-making structure.`;
    } else {
      headline = `Warm Engagement: Ongoing discussions with ${contact.company}`;
      summary = `Active dialogue with ${contact.name}. ${
        contact.lastContactedAt
          ? `Last phone interaction took place recently.`
          : "Initial meetings and notes are logged."
      } Proceed with scheduled follow-ups.`;
    }

    // Recommended Next Step
    const nextPending = pendingFollowUps[0] || pendingMeetings[0];
    const suggestedNextStep = {
      action: nextPending ? `Execute "${nextPending.title}"` : "Schedule check-in call",
      topic: nextPending?.notes || commitments[0] || `Follow-up with ${contact.name}`,
      recommendedTimeframe: nextPending ? `${nextPending.date} at ${nextPending.time}` : "Within next 24-48 hours",
    };

    // Talking points
    const talkingPoints: string[] = [
      `Reference latest discussion on ${contact.company}'s priorities`,
      ...(contact.notesList.slice(0, 2).map((n) => `Follow up on: "${n.note.substring(0, 50)}..."`)),
      `Confirm next milestone & timeline alignment`,
    ];

    return {
      healthStatus,
      healthScore,
      headline,
      summary,
      commitments,
      suggestedNextStep,
      talkingPoints,
      generatedAt: new Date().toISOString(),
    };
  }
}
