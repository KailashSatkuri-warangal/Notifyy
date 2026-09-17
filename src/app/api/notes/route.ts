import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerNoteService } from "@/services/server/NoteService";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId") || undefined;
  const search = searchParams.get("search") || undefined;

  const notes = await ServerNoteService.getNotes(session.workspace.id, { contactId, search });
  return NextResponse.json(notes);
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.contactId || !body.note) {
      return NextResponse.json({ error: "Contact and note content are required" }, { status: 400 });
    }

    const created = await ServerNoteService.createNote(session.workspace.id, body);
    return NextResponse.json({ success: true, data: created });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
