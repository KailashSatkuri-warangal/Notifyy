"use client";

import { useState } from "react";
import { Modal, Button } from "@/components/ui";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { PhoneCall, Plus, Check } from "lucide-react";

export function PostCallPromptModal() {
  const { activeCallContact, closeCallPrompt, openQuickCreate, refreshData } = useDataStore();
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!activeCallContact) return null;

  const quickPills = [
    "Left voicemail / No answer",
    "Quotation requested",
    "Discussed pricing & scope",
    "Follow-up next week",
    "Customer requested callback",
  ];

  const handleAddQuickTag = (tag: string) => {
    setNoteText((prev) => (prev ? `${prev}. ${tag}` : tag));
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: activeCallContact.id,
          activityType: "call",
          note: noteText.trim(),
        }),
      });
      toast("Call note saved!", "success");
      await refreshData();
      closeCallPrompt();
    } catch (err: any) {
      toast(err.message || "Failed to save call note", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetFollowUp = async () => {
    if (noteText.trim()) {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: activeCallContact.id,
          activityType: "call",
          note: noteText.trim(),
        }),
      });
      await refreshData();
    }
    const contactId = activeCallContact.id;
    closeCallPrompt();
    openQuickCreate("follow_up", contactId);
  };

  return (
    <Modal
      isOpen={!!activeCallContact}
      onClose={closeCallPrompt}
      title="How did the call go?"
      description={`Call logged with ${activeCallContact.name} (${activeCallContact.company})`}
    >
      <div className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            One-Tap Quick Notes
          </label>
          <div className="flex flex-wrap gap-1.5">
            {quickPills.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => handleAddQuickTag(pill)}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-zinc-800 dark:hover:bg-indigo-950 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                + {pill}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
            Call Summary / Key Takeaways
          </label>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type quick notes from the phone call..."
            className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="ghost" size="sm" onClick={closeCallPrompt} className="w-full sm:w-auto">
            Skip
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveNote}
            disabled={!noteText.trim() || isSaving}
            className="w-full sm:w-auto"
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            Save Note Only
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSetFollowUp}
            className="w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Save & Set Next Follow-Up
          </Button>
        </div>
      </div>
    </Modal>
  );
}
