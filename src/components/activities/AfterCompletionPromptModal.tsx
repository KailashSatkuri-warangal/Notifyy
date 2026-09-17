"use client";

import { useState } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { getTomorrowDateString, getNextMondayDateString } from "@/lib/date-utils";
import { REMINDER_OPTIONS } from "@/lib/constants";
import { ReminderOffset } from "@/types";
import { Sparkles, Calendar, Clock, Plus } from "lucide-react";

export function AfterCompletionPromptModal() {
  const { completedActivityContext, closeNextFollowUpPrompt, refreshData, settings } = useDataStore();
  const { toast } = useToast();
  const [date, setDate] = useState(getTomorrowDateString());
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [reminder, setReminder] = useState<ReminderOffset>(settings.defaultReminder || "1_hour");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!completedActivityContext) return null;

  const handlePreset = (pDate: string, pTime: string) => {
    setDate(pDate);
    setTime(pTime);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;

    setIsSaving(true);
    try {
      const res = await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: completedActivityContext.contactId,
          title: title.trim() || `Follow-up regarding ${completedActivityContext.sourceTitle}`,
          date,
          time,
          notes: notes.trim() || undefined,
          reminder,
        }),
      });

      if (!res.ok) throw new Error("Failed to schedule follow-up");

      toast("Next follow-up scheduled!", "success");
      await refreshData();
      closeNextFollowUpPrompt();
    } catch (err: any) {
      toast(err.message || "Failed to schedule next follow-up", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={!!completedActivityContext}
      onClose={closeNextFollowUpPrompt}
      title="Activity Completed! 🎉"
      description="Would you like to schedule the next follow-up now?"
    >
      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
          <p className="text-zinc-600 dark:text-zinc-400">
            Contact:{" "}
            <span className="font-bold text-indigo-700 dark:text-indigo-300">
              {completedActivityContext.contactName}
            </span>{" "}
            {completedActivityContext.contactCompany && `(${completedActivityContext.contactCompany})`}
          </p>
          <p className="text-zinc-500 mt-0.5">
            Previous: <span className="font-medium">{completedActivityContext.sourceTitle}</span>
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Suggested Follow-Up Timing
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePreset(getTomorrowDateString(), "11:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Tomorrow</span>
              <span className="text-[11px] text-zinc-500">11:00 AM</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset(getNextMondayDateString(), "10:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Next Monday</span>
              <span className="text-[11px] text-zinc-500">10:00 AM</span>
            </button>
            <button
              type="button"
              onClick={() => handlePreset(getTomorrowDateString(), "16:00")}
              className="p-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-indigo-50 hover:border-indigo-300 text-center transition-colors"
            >
              <span className="block font-bold text-zinc-900 dark:text-zinc-100">Tomorrow PM</span>
              <span className="text-[11px] text-zinc-500">4:00 PM</span>
            </button>
          </div>
        </div>

        <Input
          label="Follow-Up Reason / Action"
          placeholder={`Follow-up on ${completedActivityContext.sourceTitle}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            type="time"
            label="Time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Reminder Alert
          </label>
          <select
            value={reminder}
            onChange={(e) => setReminder(e.target.value as ReminderOffset)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any context for this follow-up..."
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={closeNextFollowUpPrompt}>
            Not Now
          </Button>
          <Button type="submit" isLoading={isSaving} disabled={!date || !time}>
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule Follow-Up
          </Button>
        </div>
      </form>
    </Modal>
  );
}
