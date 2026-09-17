import { Note } from "@/types";

export class NoteService {
  async getAllNotes(): Promise<Note[]> {
    const res = await fetch("/api/notes");
    if (!res.ok) return [];
    return res.json();
  }

  async getNotesByContact(contactId: string): Promise<Note[]> {
    const res = await fetch(`/api/notes?contactId=${contactId}`);
    if (!res.ok) return [];
    return res.json();
  }

  async createNote(params: {
    contactId: string;
    meetingId?: string;
    followUpId?: string;
    activityType?: Note["activityType"];
    activityId?: string;
    note: string;
  }): Promise<Note> {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create note");
    return data.data;
  }

  async deleteNote(id: string): Promise<void> {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
  }
}

export const noteService = new NoteService();
