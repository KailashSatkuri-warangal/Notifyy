"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { noteService } from "@/services/NoteService";
import { Button, Input, EmptyState } from "@/components/ui";
import { FileText, Plus, Search, Building, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function NotesPage() {
  const { notes, contacts, refreshData } = useDataStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [newNoteText, setNewNoteText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const contactMap = new Map<string, (typeof contacts)[0]>();
  contacts.forEach((c) => contactMap.set(c.id, c));

  const filteredNotes = notes.filter((n) => {
    const contact = contactMap.get(n.contactId);
    const q = searchQuery.toLowerCase().trim();
    if (selectedContactId && n.contactId !== selectedContactId) return false;
    if (q) {
      const match =
        n.note.toLowerCase().includes(q) ||
        (contact &&
          (contact.name.toLowerCase().includes(q) || contact.company.toLowerCase().includes(q)));
      if (!match) return false;
    }
    return true;
  });

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedContactId) return;

    setIsSaving(true);
    try {
      await noteService.createNote({
        contactId: selectedContactId,
        activityType: "general",
        note: newNoteText.trim(),
      });
      await refreshData();
      setNewNoteText("");
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm("Delete this note?")) {
      await noteService.deleteNote(id);
      await refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          Notes & Interaction Log
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
            {notes.length}
          </span>
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Centralized repository of client discussions, quotation requests, and key takeaways
        </p>
      </div>

      {/* Quick Add Note Card */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-xs">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3">Add Quick Business Note</h3>
        <form onSubmit={handleCreateNote} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Contact *</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="Type note (e.g. Discussed 15% discount for 100 seats)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={isSaving}
              disabled={!newNoteText.trim() || !selectedContactId}
              className="text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Save Note
            </Button>
          </div>
        </form>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder="Search notes or contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-amber-500" />}
          title="No notes found"
          description="Start logging interaction notes to maintain clear client context."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((n) => {
            const contact = contactMap.get(n.contactId);
            return (
              <div
                key={n.id}
                className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    {contact ? (
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        {contact.name}
                        <span className="text-zinc-400 font-normal">· {contact.company}</span>
                      </Link>
                    ) : (
                      <span className="text-xs font-semibold text-zinc-500">General Note</span>
                    )}

                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="p-1 rounded-md text-zinc-400 hover:text-rose-500 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                    {n.note}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="capitalize font-medium px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                    {n.activityType} note
                  </span>
                  <span>{format(new Date(n.createdAt), "d MMM yyyy, h:mm a")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
