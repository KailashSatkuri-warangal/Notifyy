"use client";

import { useState } from "react";
import { UnifiedActivity } from "@/types";
import { Modal, Button, Input } from "@/components/ui";
import { getTomorrowDateString, getNextMondayDateString, formatActivityDate } from "@/lib/date-utils";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { Calendar, Clock, RotateCcw } from "lucide-react";

interface RescheduleModalProps {
  activity: UnifiedActivity | null;
  onClose: () => void;
}

export function RescheduleModal({ activity, onClose }: RescheduleModalProps) {
  const { refreshData } = useDataStore();
  const { toast } = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!activity) return null;

  const handlePreset = (presetDate: string, presetTime: string) => {
    setDate(presetDate);
    setTime(presetTime);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setIsSaving(true);
    try {
      const endpoint =
        activity.type === "meeting"
          ? `/api/meetings/${activity.id}/reschedule`
          : `/api/follow-ups/${activity.id}/reschedule`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate: date, newTime: time, reason: reason.trim() || undefined }),
      });

      if (!res.ok) throw new Error("Failed to reschedule");

      toast(`Rescheduled to ${date} at ${time}`, "success");
      await refreshData();
      onClose();
    } catch (err: any) {
      toast(err.message || "Failed to reschedule", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!activity}
      onClose={onClose}
      title="Reschedule Activity"
      description={`Originally scheduled for ${formatActivityDate(activity.date)} at ${activity.time}`}
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs">
          <p className="font-bold text-zinc-900 dark:text-zinc-100">{activity.title}</p>
          <p className="text-zinc-500 mt-0.5">
            With <span className="font-semibold text-zinc-700 dark:text-zinc-300">{activity.contactName}</span> ({activity.contactCompany})
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Quick Reschedule Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePreset(getTomorrowDateString(), "10:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/40 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Tomorrow</span>
              <span className="text-[11px] text-zinc-500">10:00 AM</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset(getTomorrowDateString(), "15:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/40 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Tomorrow</span>
              <span className="text-[11px] text-zinc-500">3:00 PM</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset(getNextMondayDateString(), "11:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 dark:hover:bg-indigo-950/40 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Next Mon</span>
              <span className="text-[11px] text-zinc-500">11:00 AM</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="New Date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            type="time"
            label="New Time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Reason for Rescheduling (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Client requested another time, internal meeting conflict"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={!date || !time}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
