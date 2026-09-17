import { NextResponse } from "next/server";
import { getAuthenticatedSession } from "@/lib/session";
import { ServerContactService } from "@/services/server/ContactService";

export async function GET(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const isArchived = searchParams.get("archived") === "true";

  const contacts = await ServerContactService.getContacts(session.workspace.id, { search, isArchived });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await getAuthenticatedSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    if (!body.name || !body.company || !body.mobile) {
      return NextResponse.json({ error: "Name, company, and mobile are required" }, { status: 400 });
    }

    const contact = await ServerContactService.createContact(session.workspace.id, body);
    return NextResponse.json({ success: true, data: contact });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
