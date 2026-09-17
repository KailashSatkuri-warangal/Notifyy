import { Contact } from "@/types";

export class ContactService {
  async getAllContacts(): Promise<Contact[]> {
    const res = await fetch("/api/contacts");
    if (!res.ok) throw new Error("Failed to fetch contacts");
    return res.json();
  }

  async getContactById(id: string): Promise<Contact | undefined> {
    const res = await fetch(`/api/contacts/${id}`);
    if (!res.ok) return undefined;
    return res.json();
  }

  async createContact(params: {
    name: string;
    company: string;
    mobile: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<Contact> {
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create contact");
    return data.data;
  }

  async updateContact(contact: Contact): Promise<Contact> {
    const res = await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contact),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to update contact");
    return data.data;
  }

  async recordCallInteraction(contactId: string): Promise<void> {
    await fetch(`/api/contacts/${contactId}/call`, { method: "POST" });
  }

  async archiveContact(id: string): Promise<void> {
    await fetch(`/api/contacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isArchived: true }),
    });
  }

  async deleteContact(id: string): Promise<void> {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const res = await fetch(`/api/contacts?search=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    return res.json();
  }
}

export const contactService = new ContactService();
