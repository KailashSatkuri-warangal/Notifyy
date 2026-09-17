"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { RescheduleModal } from "@/components/activities/RescheduleModal";
import { UnifiedActivity } from "@/types";
import { isToday, isAfter, startOfDay } from "date-fns";
import { Button, EmptyState } from "@/components/ui";
import { Clock, Plus, AlertCircle } from "lucide-react";

export default function FollowUpsPage() {
  const { unifiedActivities, openQuickCreate } = useDataStore();
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming" | "completed">("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<UnifiedActivity | null>(null);

  const followUps = unifiedActivities.filter((a) => a.type === "follow_up");

  const filtered = followUps.filter((f) => {
    if (filter === "today") return isToday(f.dateTime);
    if (filter === "overdue") return f.status === "overdue";
    if (filter === "upcoming") return isAfter(f.dateTime, startOfDay(new Date())) && f.status === "pending";
    if (filter === "completed") return f.status === "completed";
    return true;
  });

  const overdueCount = followUps.filter((f) => f.status === "overdue").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Follow-Ups
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              {followUps.length}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Never lose momentum. Track follow-up calls, proposal check-ins, and reminders
          </p>
        </div>

        <Button onClick={() => openQuickCreate("follow_up")}>
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Follow-Up
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          All ({followUps.length})
        </button>
        <button
          onClick={() => setFilter("today")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === "today"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setFilter("overdue")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
            filter === "overdue"
              ? "bg-rose-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <span>Overdue</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {overdueCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setFilter("upcoming")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === "upcoming"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === "completed"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          Completed
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-8 h-8 text-indigo-500" />}
          title="No follow-ups found"
          description="Create a follow-up action to ensure you never drop a lead."
          action={
            <Button size="sm" onClick={() => openQuickCreate("follow_up")}>
              <Plus className="w-4 h-4 mr-1" />
              Schedule Follow-Up
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <ActivityCard
              key={f.id}
              activity={f}
              onReschedule={(act) => setRescheduleTarget(act)}
            />
          ))}
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        activity={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
      />
    </div>
  );
}
