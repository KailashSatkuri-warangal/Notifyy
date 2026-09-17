"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { RescheduleModal } from "@/components/activities/RescheduleModal";
import { UnifiedActivity } from "@/types";
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  formatActivityTime,
} from "@/lib/date-utils";
import { Button, Badge, Modal } from "@/components/ui";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Video,
  Clock,
  Calendar as CalIcon,
  Eye,
} from "lucide-react";

export default function CalendarPage() {
  const { unifiedActivities, openQuickCreate } = useDataStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedActivity, setSelectedActivity] = useState<UnifiedActivity | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<UnifiedActivity | null>(null);

  // Month navigation
  const nextPeriod = () => {
    if (viewMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const prevPeriod = () => {
    if (viewMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Month Grid Calculation
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Week Grid Calculation
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(weekStart);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Selected Day's activities
  const selectedDayActivities = unifiedActivities.filter((a) => isSameDay(a.dateTime, selectedDay));

  return (
    <div className="space-y-6">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Calendar
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            {format(currentDate, "MMMM yyyy")} · Schedule & Time Distribution
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Today Button */}
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>

          {/* Nav Arrows */}
          <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Selector */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "month"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "week"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode("day")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === "day"
                  ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* 1. MONTH VIEW */}
      {viewMode === "month" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Month Matrix */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 sm:p-6 shadow-xs">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Day Cells Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((day) => {
                const dayActivities = unifiedActivities.filter((a) => isSameDay(a.dateTime, day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = isSameDay(day, selectedDay);
                const isCurrentDay = isToday(day);

                const hasMeeting = dayActivities.some((a) => a.type === "meeting");
                const hasFollowUp = dayActivities.some((a) => a.type === "follow_up");
                const hasOverdue = dayActivities.some((a) => a.status === "overdue");

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[70px] sm:min-h-[90px] p-2 rounded-2xl flex flex-col justify-between border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30"
                        : isCurrentDay
                        ? "bg-zinc-50 dark:bg-zinc-800/60 border-zinc-300 dark:border-zinc-700 font-bold"
                        : isCurrentMonth
                        ? "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
                        : "bg-zinc-50/40 dark:bg-zinc-900/20 border-transparent opacity-40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${
                          isCurrentDay
                            ? "w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center -ml-1"
                            : isSelected
                            ? "text-indigo-600 dark:text-indigo-400"
                            : "text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {format(day, "d")}
                      </span>

                      {hasOverdue && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Overdue activities" />
                      )}
                    </div>

                    {/* Activity indicator pills */}
                    <div className="space-y-1 mt-1">
                      {dayActivities.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedActivity(a);
                          }}
                          className={`text-[10px] truncate px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 ${
                            a.type === "meeting"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                          }`}
                        >
                          <span className="truncate">{a.title}</span>
                        </div>
                      ))}
                      {dayActivities.length > 2 && (
                        <span className="text-[10px] font-bold text-zinc-400 block text-right">
                          +{dayActivities.length - 2} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Agenda Drawer (Side) */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {format(selectedDay, "EEEE, d MMMM")}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {selectedDayActivities.length} scheduled item{selectedDayActivities.length === 1 ? "" : "s"}
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => openQuickCreate("follow_up")}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {selectedDayActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
                  <CalIcon className="w-8 h-8 text-zinc-300 mx-auto" />
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">No activities on this day</p>
                  <p>Click &quot;Add&quot; to schedule a meeting or follow-up.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {selectedDayActivities.map((act) => (
                    <ActivityCard
                      key={act.id}
                      activity={act}
                      compact
                      onReschedule={(t) => setRescheduleTarget(t)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. WEEK VIEW */}
      {viewMode === "week" && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((day) => {
              const dayActs = unifiedActivities.filter((a) => isSameDay(a.dateTime, day));
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`p-3 rounded-2xl border flex flex-col justify-between min-h-[300px] ${
                    isCurrentDay
                      ? "bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-800"
                      : "bg-zinc-50/50 dark:bg-zinc-800/30 border-zinc-100 dark:border-zinc-800"
                  }`}
                >
                  <div>
                    <div className="text-center pb-2 border-b border-zinc-200 dark:border-zinc-700/60 mb-2">
                      <p className="text-[11px] font-semibold text-zinc-500 uppercase">
                        {format(day, "EEE")}
                      </p>
                      <p
                        className={`text-sm font-black mt-0.5 ${
                          isCurrentDay ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-800 dark:text-zinc-200"
                        }`}
                      >
                        {format(day, "d")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {dayActs.map((act) => (
                        <div
                          key={act.id}
                          onClick={() => setSelectedActivity(act)}
                          className={`p-2 rounded-xl text-xs font-semibold cursor-pointer hover:shadow-xs transition-shadow ${
                            act.type === "meeting"
                              ? "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                              : "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-200"
                          }`}
                        >
                          <span className="text-[10px] text-zinc-500 block">
                            {formatActivityTime(act.time)}
                          </span>
                          <p className="truncate font-bold mt-0.5">{act.title}</p>
                          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 truncate">
                            {act.contactName}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => openQuickCreate("follow_up")}
                    className="w-full mt-2 py-1 text-[11px] font-semibold text-zinc-500 hover:text-indigo-600 rounded-lg hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  >
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. DAY VIEW */}
      {viewMode === "day" && (
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {format(currentDate, "EEEE, d MMMM yyyy")}
            </h3>
            <Button size="sm" onClick={() => openQuickCreate("follow_up")}>
              <Plus className="w-4 h-4 mr-1" />
              Add Activity
            </Button>
          </div>

          {selectedDayActivities.length === 0 ? (
            <div className="py-12 text-center text-sm text-zinc-500">
              No meetings or follow-ups for this date.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayActivities.map((act) => (
                <ActivityCard
                  key={act.id}
                  activity={act}
                  onReschedule={(t) => setRescheduleTarget(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Activity Details Modal when clicked */}
      <Modal
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        title={selectedActivity?.title}
        description={`Scheduled with ${selectedActivity?.contactName} (${selectedActivity?.contactCompany})`}
      >
        {selectedActivity && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant={selectedActivity.type === "meeting" ? "meeting" : "followup"}>
                {selectedActivity.type}
              </Badge>
              <Badge variant={selectedActivity.status}>{selectedActivity.status}</Badge>
            </div>

            <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Date & Time:</span>{" "}
                {format(selectedActivity.dateTime, "EEEE, d MMMM yyyy · h:mm a")}
              </p>
              {selectedActivity.location && (
                <p>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Location:</span>{" "}
                  {selectedActivity.location}
                </p>
              )}
              {selectedActivity.purpose && (
                <p>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">Purpose:</span>{" "}
                  {selectedActivity.purpose}
                </p>
              )}
            </div>

            {selectedActivity.notes && (
              <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
                {selectedActivity.notes}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  const target = selectedActivity;
                  setSelectedActivity(null);
                  setRescheduleTarget(target);
                }}
              >
                Reschedule
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reschedule Modal */}
      <RescheduleModal
        activity={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
      />
    </div>
  );
}
