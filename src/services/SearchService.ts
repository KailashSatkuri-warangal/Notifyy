import { Contact, Meeting, FollowUp, Note } from "@/types";

export interface SearchResults {
  contacts: Contact[];
  meetings: (Meeting & { contactName?: string; contactCompany?: string })[];
  followUps: (FollowUp & { contactName?: string; contactCompany?: string })[];
  notes: (Note & { contactName?: string; contactCompany?: string })[];
  totalCount: number;
}

export class SearchService {
  async search(query: string): Promise<SearchResults> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return { contacts: [], meetings: [], followUps: [], notes: [], totalCount: 0 };
    }

    try {
      const [cRes, mRes, fRes, nRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/meetings"),
        fetch("/api/follow-ups"),
        fetch("/api/notes"),
      ]);

      const [allContacts, allMeetings, allFollowUps, allNotes]: [
        Contact[],
        Meeting[],
        FollowUp[],
        Note[]
      ] = await Promise.all([
        cRes.json(),
        mRes.json(),
        fRes.json(),
        nRes.json(),
      ]);

      const contactMap = new Map<string, Contact>();
      if (Array.isArray(allContacts)) {
        allContacts.forEach((c) => contactMap.set(c.id, c));
      }

      // Filter contacts
      const matchedContacts = (Array.isArray(allContacts) ? allContacts : []).filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.mobile?.includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );

      // Filter meetings
      const matchedMeetings = (Array.isArray(allMeetings) ? allMeetings : [])
        .filter((m) => {
          const contact = contactMap.get(m.contactId);
          const contactName = contact?.name.toLowerCase() || "";
          const contactComp = contact?.company.toLowerCase() || "";
          return (
            m.title?.toLowerCase().includes(q) ||
            (m.purpose && m.purpose.toLowerCase().includes(q)) ||
            (m.location && m.location.toLowerCase().includes(q)) ||
            contactName.includes(q) ||
            contactComp.includes(q)
          );
        })
        .map((m) => {
          const contact = contactMap.get(m.contactId);
          return {
            ...m,
            contactName: contact?.name,
            contactCompany: contact?.company,
          };
        });

      // Filter followUps
      const matchedFollowUps = (Array.isArray(allFollowUps) ? allFollowUps : [])
        .filter((f) => {
          const contact = contactMap.get(f.contactId);
          const contactName = contact?.name.toLowerCase() || "";
          const contactComp = contact?.company.toLowerCase() || "";
          return (
            f.title?.toLowerCase().includes(q) ||
            (f.notes && f.notes.toLowerCase().includes(q)) ||
            contactName.includes(q) ||
            contactComp.includes(q)
          );
        })
        .map((f) => {
          const contact = contactMap.get(f.contactId);
          return {
            ...f,
            contactName: contact?.name,
            contactCompany: contact?.company,
          };
        });

      // Filter notes
      const matchedNotes = (Array.isArray(allNotes) ? allNotes : [])
        .filter((n) => {
          const contact = contactMap.get(n.contactId);
          const contactName = contact?.name.toLowerCase() || "";
          return n.note?.toLowerCase().includes(q) || contactName.includes(q);
        })
        .map((n) => {
          const contact = contactMap.get(n.contactId);
          return {
            ...n,
            contactName: contact?.name,
            contactCompany: contact?.company,
          };
        });

      const totalCount =
        matchedContacts.length +
        matchedMeetings.length +
        matchedFollowUps.length +
        matchedNotes.length;

      return {
        contacts: matchedContacts,
        meetings: matchedMeetings,
        followUps: matchedFollowUps,
        notes: matchedNotes,
        totalCount,
      };
    } catch (err) {
      console.error("Search error", err);
      return { contacts: [], meetings: [], followUps: [], notes: [], totalCount: 0 };
    }
  }
}

export const searchService = new SearchService();
