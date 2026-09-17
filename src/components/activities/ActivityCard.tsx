"use client";

import { UnifiedActivity, Contact } from "@/types";
import { Badge } from "@/components/ui";
import {
  Phone,
  CheckCircle2,
  Clock,
  Calendar as CalIcon,
  MapPin,
  MessageSquare,
  AlertCircle,
  Share2,
  CalendarPlus,
  Download,
} from "lucide-react";
import {
  formatActivityDate,
  formatActivityTime,
  getRelativeTimeLabel,
  generateGoogleCalendarUrl,
  generateIcsContent,
  downloadIcsFile,
} from "@/lib/date-utils";
import { useCallAction } from "@/hooks/useCallAction";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { WhatsAppModal } from "./WhatsAppModal";
import confetti from "canvas-confetti";
import { useState } from "react";
import Link from "next/link";

interface ActivityCardProps {
  activity: UnifiedActivity;
  onReschedule?: (activity: UnifiedActivity) => void;
  onOpenNotes?: (activity: UnifiedActivity) => void;
  compact?: boolean;
}

export function ActivityCard({ activity, onReschedule, onOpenNotes, compact = false }: ActivityCardProps) {
  const { initiateCall } = useCallAction();
  const { contacts, refreshData, openNextFollowUpPrompt } = useDataStore();
  const { toast } = useToast();
  const [isCompleting, setIsCompleting] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const contact = contacts.find((c) => c.id === activity.contactId) || {
    id: activity.contactId,
    name: activity.contactName,
    company: activity.contactCompany,
    mobile: activity.contactMobile,
  } as Contact;

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact && contact.mobile) {
      initiateCall(contact);
    }
  };

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCompleting(true);
    try {
      const endpoint =
        activity.type === "meeting"
          ? `/api/meetings/${activity.id}/complete`
          : `/api/follow-ups/${activity.id}/complete`;

      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error("Failed to complete activity");

      // Trigger micro-confetti
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      toast(`${activity.type === "meeting" ? "Meeting" : "Follow-up"} completed!`, "success");

      await refreshData();

      // Ask to set next follow-up
      openNextFollowUpPrompt({
        contactId: activity.contactId,
        contactName: activity.contactName,
        contactCompany: activity.contactCompany,
        sourceTitle: activity.title,
      });
    } catch (err: any) {
      toast(err.message || "Failed to complete activity", "error");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleAddToGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateGoogleCalendarUrl({
      title: `${activity.type === "meeting" ? "Meeting" : "Follow-Up"}: ${activity.title} (${activity.contactName})`,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      description: `Contact: ${activity.contactName} (${activity.contactCompany} · ${activity.contactMobile})\n\nNotes: ${activity.notes || "None"}`,
    });
    window.open(url, "_blank", "noopener,noreferrer");
    toast("Opening Google Calendar...", "success");
  };

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const icsContent = generateIcsContent([
      {
        id: activity.id,
        title: `${activity.type === "meeting" ? "Meeting" : "Follow-Up"}: ${activity.title} (${activity.contactName})`,
        date: activity.date,
        time: activity.time,
        location: activity.location,
        description: `Contact: ${activity.contactName} (${activity.contactCompany} · ${activity.contactMobile})\n\nNotes: ${activity.notes || ""}`,
      },
    ]);
    downloadIcsFile(`notifyy-${activity.type}-${activity.date}`, icsContent);
    toast("iCal (.ics) downloaded", "success");
  };

  const isOverdue = activity.status === "overdue";
  const isCompleted = activity.status === "completed";

  return (
    <>
      <div
        className={`group relative rounded-2xl sm:rounded-3xl border p-4 sm:p-5 transition-all ${
          isOverdue
            ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs"
            : isCompleted
            ? "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-80"
            : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
        }`}
      >
        <div className="flex flex-col gap-3">
          {/* Header row with badges & time */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant={activity.type === "meeting" ? "meeting" : "followup"}>
                {activity.type === "meeting" ? "Meeting" : "Follow-Up"}
              </Badge>

              <Badge variant={activity.status as any}>{activity.status}</Badge>

              {isOverdue && (
                <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {getRelativeTimeLabel(activity.date, activity.time)}
                </span>
              )}

              {!isOverdue && !isCompleted && (
                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  {getRelativeTimeLabel(activity.date, activity.time)}
                </span>
              )}
            </div>

            {/* Quick GCal & ICS Sync Icons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleAddToGoogleCalendar}
                title="Add to Google Calendar"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <CalendarPlus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDownloadIcs}
                title="Download .ics calendar event"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Title & Contact details */}
          <div>
            <h4
              className={`text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug ${
                isCompleted ? "line-through text-zinc-500" : ""
              }`}
            >
              {activity.title}
            </h4>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
              <Link
                href={`/contacts/${activity.contactId}`}
                className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {activity.contactName}
              </Link>
              {activity.contactCompany && (
                <span className="text-zinc-400 dark:text-zinc-500">
                  · {activity.contactCompany}
                </span>
              )}
              <span className="text-zinc-400 dark:text-zinc-500">
                · {formatActivityDate(activity.date)} at {formatActivityTime(activity.time)}
              </span>
            </div>

            {activity.location && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                <span className="truncate">{activity.location}</span>
              </div>
            )}

            {activity.notes && !compact && (
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/60 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/80 line-clamp-2">
                {activity.notes}
              </p>
            )}
          </div>

          {/* Bottom Action Bar (Fully responsive for mobile touch) */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-zinc-100 dark:border-zinc-800">
            {/* Communication Actions: Call & WhatsApp */}
            <div className="flex items-center gap-1.5">
              {activity.contactMobile && (
                <>
                  <button
                    onClick={handleCall}
                    title={`Call ${activity.contactName}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => setIsWhatsAppOpen(true)}
                    title={`WhatsApp ${activity.contactName}`}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>
                </>
              )}
            </div>

            {/* Lifecycle Actions: Reschedule & Complete */}
            <div className="flex items-center gap-1.5 ml-auto">
              {onReschedule && !isCompleted && (
                <button
                  onClick={() => onReschedule(activity)}
                  title="Reschedule activity"
                  className="px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                >
                  Reschedule
                </button>
              )}

              {!isCompleted && (
                <button
                  onClick={handleComplete}
                  disabled={isCompleting}
                  title="Mark as Completed"
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Smart Composer Modal */}
      <WhatsAppModal
        contact={contact}
        activity={activity}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />
    </>
  );
}
