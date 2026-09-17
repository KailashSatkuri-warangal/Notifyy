"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { RescheduleModal } from "@/components/activities/RescheduleModal";
import { UnifiedActivity } from "@/types";
import { isToday, isTomorrow, isAfter, startOfDay } from "date-fns";
import { Button, EmptyState } from "@/components/ui";
import { Video, Plus, Search, Calendar } from "lucide-react";

export default function MeetingsPage() {
  const { unifiedActivities, openQuickCreate } = useDataStore();
  const [filter, setFilter] = useState<"all" | "today" | "upcoming" | "completed">("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<UnifiedActivity | null>(null);

  const meetings = unifiedActivities.filter((a) => a.type === "meeting");

  const filtered = meetings.filter((m) => {
    if (filter === "today") return isToday(m.dateTime);
    if (filter === "upcoming") return isAfter(m.dateTime, startOfDay(new Date())) && m.status === "pending";
    if (filter === "completed") return m.status === "completed";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Meetings
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
              {meetings.length}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Track video calls, in-person discussions, and strategy reviews
          </p>
        </div>

        <Button onClick={() => openQuickCreate("meeting")}>
          <Plus className="w-4 h-4 mr-1.5" />
          Schedule Meeting
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-fit">
        <button
          onClick={() => setFilter("all")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === "all"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          All ({meetings.length})
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

      {/* List of Meetings */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Video className="w-8 h-8 text-blue-500" />}
          title="No meetings found"
          description="Schedule a new client meeting to stay coordinated."
          action={
            <Button size="sm" onClick={() => openQuickCreate("meeting")}>
              <Plus className="w-4 h-4 mr-1" />
              Schedule Meeting
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <ActivityCard
              key={m.id}
              activity={m}
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
