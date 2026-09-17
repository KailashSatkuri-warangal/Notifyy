import { prisma } from "@/lib/prisma";

export class ServerNoteService {
  static async getNotes(workspaceId: string, options?: { contactId?: string; search?: string }) {
    const q = options?.search?.toLowerCase().trim();

    return prisma.note.findMany({
      where: {
        workspaceId,
        ...(options?.contactId ? { contactId: options.contactId } : {}),
        ...(q ? { note: { contains: q } } : {}),
      },
      include: { contact: true },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createNote(
    workspaceId: string,
    params: {
      contactId: string;
      meetingId?: string;
      followUpId?: string;
      activityType?: string;
      note: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.note.create({
        data: {
          workspaceId,
          contactId: params.contactId,
          meetingId: params.meetingId || null,
          followUpId: params.followUpId || null,
          activityType: params.activityType || "general",
          note: params.note.trim(),
        },
        include: { contact: true },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: params.contactId,
          activityType: "note",
          activityId: created.id,
          action: "note_added",
          newData: JSON.stringify({ snippet: params.note.substring(0, 60) }),
        },
      });

      return created;
    });
  }

  static async deleteNote(workspaceId: string, noteId: string) {
    return prisma.note.deleteMany({
      where: { id: noteId, workspaceId },
    });
  }
}
