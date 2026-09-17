"use client";

import { UnifiedActivity } from "@/types";
import { Badge, Button } from "@/components/ui";
import { Phone, CheckCircle2, Clock, Calendar as CalIcon, MapPin, MessageSquare, AlertCircle } from "lucide-react";
import { formatActivityDate, formatActivityTime, getRelativeTimeLabel } from "@/lib/date-utils";
import { useCallAction } from "@/hooks/useCallAction";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
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

  const contact = contacts.find((c) => c.id === activity.contactId);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (contact) {
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

  const isOverdue = activity.status === "overdue";
  const isCompleted = activity.status === "completed";

  return (
    <div
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all ${
        isOverdue
          ? "bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs"
          : isCompleted
          ? "bg-zinc-50/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 opacity-80"
          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        {/* Main Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
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

          <h4 className={`text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug ${isCompleted ? "line-through text-zinc-500" : ""}`}>
            {activity.title}
          </h4>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <Link
              href={`/contacts/${activity.contactId}`}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
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

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
          {activity.contactMobile && (
            <button
              onClick={handleCall}
              title={`Call ${activity.contactName}`}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 fill-current" />
              <span>Call</span>
            </button>
          )}

          {onOpenNotes && (
            <button
              onClick={() => onOpenNotes(activity)}
              title="Add / View Notes"
              className="p-2 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          )}

          {onReschedule && !isCompleted && (
            <button
              onClick={() => onReschedule(activity)}
              title="Reschedule activity"
              className="px-2.5 py-1.5 rounded-xl text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Reschedule
            </button>
          )}

          {!isCompleted && (
            <button
              onClick={handleComplete}
              disabled={isCompleting}
              title="Mark as Completed"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Complete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
