import { prisma } from "@/lib/prisma";
import { getAvatarColor } from "@/lib/utils";

export class ServerContactService {
  static async getContacts(
    workspaceId: string,
    options?: { search?: string; filter?: string; isArchived?: boolean }
  ) {
    const q = options?.search?.toLowerCase().trim();

    return prisma.contact.findMany({
      where: {
        workspaceId,
        isArchived: options?.isArchived ?? false,
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { company: { contains: q } },
                { mobile: { contains: q } },
                { email: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        meetings: {
          where: { status: "pending" },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 1,
        },
        followUps: {
          where: { status: "pending" },
          orderBy: [{ date: "asc" }, { time: "asc" }],
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  }

  static async getContactById(workspaceId: string, contactId: string) {
    return prisma.contact.findFirst({
      where: { id: contactId, workspaceId },
      include: {
        meetings: { orderBy: [{ date: "desc" }, { time: "desc" }] },
        followUps: { orderBy: [{ date: "desc" }, { time: "desc" }] },
        notesList: { orderBy: { createdAt: "desc" } },
        history: { orderBy: { createdAt: "desc" } },
      },
    });
  }

  static async createContact(
    workspaceId: string,
    params: {
      name: string;
      company: string;
      mobile: string;
      email?: string;
      address?: string;
      notes?: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          workspaceId,
          name: params.name.trim(),
          company: params.company.trim(),
          mobile: params.mobile.trim(),
          email: params.email?.trim() || null,
          address: params.address?.trim() || null,
          notes: params.notes?.trim() || null,
          avatarColor: getAvatarColor(params.name),
          isArchived: false,
        },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: contact.id,
          activityType: "contact",
          activityId: contact.id,
          action: "created",
          newData: JSON.stringify({ name: contact.name, company: contact.company }),
        },
      });

      return contact;
    });
  }

  static async updateContact(
    workspaceId: string,
    contactId: string,
    params: {
      name?: string;
      company?: string;
      mobile?: string;
      email?: string;
      address?: string;
      notes?: string;
      isArchived?: boolean;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.contact.findFirst({
        where: { id: contactId, workspaceId },
      });
      if (!existing) throw new Error("Contact not found");

      const updated = await tx.contact.update({
        where: { id: contactId },
        data: {
          ...(params.name ? { name: params.name.trim(), avatarColor: getAvatarColor(params.name) } : {}),
          ...(params.company ? { company: params.company.trim() } : {}),
          ...(params.mobile ? { mobile: params.mobile.trim() } : {}),
          ...(params.email !== undefined ? { email: params.email?.trim() || null } : {}),
          ...(params.address !== undefined ? { address: params.address?.trim() || null } : {}),
          ...(params.notes !== undefined ? { notes: params.notes?.trim() || null } : {}),
          ...(params.isArchived !== undefined ? { isArchived: params.isArchived } : {}),
        },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId: updated.id,
          activityType: "contact",
          activityId: updated.id,
          action: "edited",
          previousData: JSON.stringify({ name: existing.name, company: existing.company }),
          newData: JSON.stringify({ name: updated.name, company: updated.company }),
        },
      });

      return updated;
    });
  }

  static async recordCall(workspaceId: string, contactId: string) {
    const now = new Date().toISOString();
    return prisma.$transaction(async (tx) => {
      await tx.contact.update({
        where: { id: contactId },
        data: { lastContactedAt: now },
      });

      await tx.activityHistory.create({
        data: {
          workspaceId,
          contactId,
          activityType: "call",
          activityId: "call_" + Date.now(),
          action: "called",
          newData: JSON.stringify({ timestamp: now }),
        },
      });
    });
  }

  static async deleteContact(workspaceId: string, contactId: string) {
    return prisma.contact.deleteMany({
      where: { id: contactId, workspaceId },
    });
  }
}
