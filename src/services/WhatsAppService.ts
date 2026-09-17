export interface WhatsAppTemplate {
  id: string;
  label: string;
  generateText: (ctx: {
    contactName: string;
    company?: string;
    userName?: string;
    title?: string;
    date?: string;
    time?: string;
    notes?: string;
  }) => string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "meeting_confirmation",
    label: "Meeting Confirmation",
    generateText: (ctx) =>
      `Hi ${ctx.contactName}, confirming our meeting scheduled for ${ctx.date || "our upcoming slot"} at ${ctx.time || ""}${
        ctx.title ? ` regarding "${ctx.title}"` : ""
      }. Looking forward to speaking! - ${ctx.userName || "Notifyy"}`,
  },
  {
    id: "meeting_followup",
    label: "Post-Meeting Summary",
    generateText: (ctx) =>
      `Hi ${ctx.contactName}, thank you for taking the time to speak today${
        ctx.title ? ` regarding "${ctx.title}"` : ""
      }.${ctx.notes ? `\n\nKey takeaways: ${ctx.notes}` : ""}\n\nPlease let me know if you have any questions!`,
  },
  {
    id: "quotation_checkin",
    label: "Quotation / Proposal Follow-Up",
    generateText: (ctx) =>
      `Hi ${ctx.contactName}, following up regarding the proposal for ${
        ctx.company || "your team"
      }. Have you had a chance to review? Happy to jump on a quick 5-minute call to answer any questions.`,
  },
  {
    id: "followup_checkin",
    label: "Quick Follow-Up Check-In",
    generateText: (ctx) =>
      `Hi ${ctx.contactName}, checking in on our follow-up${
        ctx.title ? ` regarding "${ctx.title}"` : ""
      }. Are you available for a brief discussion this week?`,
  },
  {
    id: "reschedule_notice",
    label: "Reschedule Request",
    generateText: (ctx) =>
      `Hi ${ctx.contactName}, I need to adjust our scheduled time for "${ctx.title || "our discussion"}". Would ${
        ctx.date || "tomorrow"
      } at ${ctx.time || "11:00 AM"} work better for you? Apologies for any inconvenience!`,
  },
];

export class WhatsAppService {
  static cleanPhoneNumber(phone: string): string {
    return phone.replace(/[^\d+]/g, "").replace(/^00/, "").replace(/^\+/, "");
  }

  static buildWhatsAppUrl(phone: string, message: string): string {
    const cleanNumber = this.cleanPhoneNumber(phone);
    const encoded = encodeURIComponent(message.trim());
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  }

  static openWhatsApp(phone: string, message: string): void {
    const url = this.buildWhatsAppUrl(phone, message);
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }
}
