"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { RescheduleModal } from "@/components/activities/RescheduleModal";
import { UnifiedActivity } from "@/types";
import { isToday, generateIcsContent, downloadIcsFile } from "@/lib/date-utils";
import { useToast } from "@/components/ui/Toast";
import {
  Video,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  Download,
} from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default function DashboardPage() {
  const { unifiedActivities, openQuickCreate, dashboardStats } = useDataStore();
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState<"all" | "meetings" | "follow_ups" | "overdue">("all");
  const [rescheduleTarget, setRescheduleTarget] = useState<UnifiedActivity | null>(null);

  const todayActivities = unifiedActivities.filter((a) => isToday(a.dateTime));
  const todayMeetings = todayActivities.filter((a) => a.type === "meeting" && a.status !== "cancelled");
  const todayFollowUps = todayActivities.filter((a) => a.type === "follow_up" && a.status !== "cancelled");
  const overdueActivities = unifiedActivities.filter((a) => a.status === "overdue");

  let displayedActivities = todayActivities;
  if (activeFilter === "meetings") {
    displayedActivities = todayMeetings;
  } else if (activeFilter === "follow_ups") {
    displayedActivities = todayFollowUps;
  } else if (activeFilter === "overdue") {
    displayedActivities = overdueActivities;
  }

  const handleExportTodayIcs = () => {
    if (todayActivities.length === 0) {
      toast("No activities scheduled for today", "info");
      return;
    }

    const icsContent = generateIcsContent(
      todayActivities.map((a) => ({
        id: a.id,
        title: `${a.type === "meeting" ? "Meeting" : "Follow-Up"}: ${a.title} (${a.contactName})`,
        date: a.date,
        time: a.time,
        location: a.location,
        description: `Contact: ${a.contactName} (${a.contactCompany} · ${a.contactMobile})\n\nNotes: ${a.notes || ""}`,
      }))
    );
    downloadIcsFile(`notifyy-today-schedule`, icsContent);
    toast("Today's agenda exported to calendar (.ics)", "success");
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Today&apos;s Schedule
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {dashboardStats.todayMeetings + dashboardStats.todayFollowUps} total activities scheduled for today
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportTodayIcs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-indigo-600 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden xs:inline">Export Agenda</span>
          </button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openQuickCreate("meeting")}
            className="text-xs"
          >
            <Video className="w-3.5 h-3.5 mr-1 text-blue-600" />
            + Meeting
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openQuickCreate("follow_up")}
            className="text-xs"
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            + Follow-Up
          </Button>
        </div>
      </div>

      {/* Primary Summary Metric Cards - Calculated Purely from Database */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Meetings */}
        <button
          onClick={() => setActiveFilter(activeFilter === "meetings" ? "all" : "meetings")}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === "meetings"
              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/30"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Meetings</span>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {dashboardStats.todayMeetings}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Scheduled today</p>
          </div>
        </button>

        {/* Today's Follow-Ups */}
        <button
          onClick={() => setActiveFilter(activeFilter === "follow_ups" ? "all" : "follow_ups")}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === "follow_ups"
              ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/30"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Follow-Ups</span>
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {dashboardStats.todayFollowUps}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Due today</p>
          </div>
        </button>

        {/* Overdue */}
        <button
          onClick={() => setActiveFilter(activeFilter === "overdue" ? "all" : "overdue")}
          className={`p-4 rounded-2xl sm:rounded-3xl border text-left transition-all cursor-pointer ${
            activeFilter === "overdue"
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/30"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Overdue</span>
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
              {dashboardStats.overdueActivities}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Needs attention</p>
          </div>
        </button>

        {/* Completed Today */}
        <div className="p-4 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">Completed</span>
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {dashboardStats.completedToday}
            </span>
            <p className="text-[11px] text-zinc-400 mt-0.5">Done today</p>
          </div>
        </div>
      </div>

      {/* Overdue Urgent Alert Banner */}
      {dashboardStats.overdueActivities > 0 && activeFilter !== "overdue" && (
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-rose-500/10 border border-rose-300 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shadow-xs shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
                {dashboardStats.overdueActivities} overdue activity{dashboardStats.overdueActivities > 1 ? "s" : ""} need attention
              </h4>
              <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                Take quick action or reschedule to maintain client momentum.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setActiveFilter("overdue")}
            className="text-xs shrink-0 w-full sm:w-auto"
          >
            View Overdue
          </Button>
        </div>
      )}

      {/* Timeline Section */}
      <div className="space-y-4">
        <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {activeFilter === "all"
                ? "Today's Timeline"
                : activeFilter === "meetings"
                ? "Today's Meetings"
                : activeFilter === "follow_ups"
                ? "Today's Follow-Ups"
                : "Overdue Activities"}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {displayedActivities.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "all"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter("meetings")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "meetings"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Meetings
            </button>
            <button
              onClick={() => setActiveFilter("follow_ups")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "follow_ups"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Follow-Ups
            </button>
            <button
              onClick={() => setActiveFilter("overdue")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === "overdue"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              Overdue
            </button>
          </div>
        </div>

        {displayedActivities.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
            title="All clear for now!"
            description={
              activeFilter === "overdue"
                ? "No overdue activities. Great job staying on top of your schedule!"
                : "No activities scheduled under this view. Click below to add one."
            }
            action={
              <Button size="sm" onClick={() => openQuickCreate("follow_up")}>
                <Plus className="w-4 h-4 mr-1" />
                Schedule New Activity
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {displayedActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onReschedule={(act) => setRescheduleTarget(act)}
              />
            ))}
          </div>
        )}
      </div>

      <RescheduleModal
        activity={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
      />
    </div>
  );
}
