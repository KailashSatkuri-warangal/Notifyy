import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerNoteService } from "@/services/server/NoteService";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await ServerNoteService.deleteNote(session.workspace.id, id);
  return NextResponse.json({ success: true });
}
