"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDataStore } from "@/hooks/useDataStore";
import { useCallAction } from "@/hooks/useCallAction";
import { noteService } from "@/services/NoteService";
import { contactService } from "@/services/ContactService";
import { ActivityCard } from "@/components/activities/ActivityCard";
import { RescheduleModal } from "@/components/activities/RescheduleModal";
import { WhatsAppModal } from "@/components/activities/WhatsAppModal";
import { AISummaryCard } from "@/components/activities/AISummaryCard";
import { UnifiedActivity, Contact, Note, ActivityHistory } from "@/types";
import { Button, Input, Modal, EmptyState } from "@/components/ui";
import {
  Phone,
  Mail,
  Building,
  MapPin,
  Calendar,
  Clock,
  Video,
  Plus,
  MessageSquare,
  FileText,
  ArrowLeft,
  Edit2,
  CalendarPlus,
  Download,
} from "lucide-react";
import { getInitials } from "@/lib/utils";
import { format, generateIcsContent, downloadIcsFile } from "@/lib/date-utils";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface ContactDetailData extends Contact {
  history?: ActivityHistory[];
  notesList?: Note[];
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params?.id as string;
  const { contacts, unifiedActivities, openQuickCreate, refreshData } = useDataStore();
  const { initiateCall } = useCallAction();
  const { toast } = useToast();

  const [detailedContact, setDetailedContact] = useState<ContactDetailData | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  const [activeTab, setActiveTab] = useState<"timeline" | "activities" | "notes">("timeline");
  const [quickNoteText, setQuickNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<UnifiedActivity | null>(null);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Edit contact modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fallbackContact = contacts.find((c) => c.id === contactId);

  const fetchContactDetail = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailedContact(data);
      }
    } catch (err) {
      console.error("Failed to load contact detail", err);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [contactId]);

  useEffect(() => {
    fetchContactDetail();
  }, [fetchContactDetail]);

  const contact = detailedContact || fallbackContact;

  if (!contact && !isLoadingDetail) {
    return (
      <div className="py-12 text-center space-y-3">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-200">Contact Not Found</h2>
        <p className="text-sm text-zinc-500">The requested contact does not exist or has been removed.</p>
        <Button onClick={() => router.push("/contacts")}>Return to Contacts</Button>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-12 text-center text-sm text-zinc-500">
        Loading contact details...
      </div>
    );
  }

  const contactActivities = unifiedActivities.filter((a) => a.contactId === contactId);
  const contactNotes = detailedContact?.notesList || [];
  const contactHistory: ActivityHistory[] = (detailedContact?.history || []).map((h) => {
    let parsedPrev = h.previousData;
    let parsedNew = h.newData;
    if (typeof parsedPrev === "string") {
      try { parsedPrev = JSON.parse(parsedPrev); } catch { /* ignore */ }
    }
    if (typeof parsedNew === "string") {
      try { parsedNew = JSON.parse(parsedNew); } catch { /* ignore */ }
    }
    return {
      ...h,
      previousData: parsedPrev,
      newData: parsedNew,
    };
  });

  const handleOpenEdit = () => {
    setEditName(contact.name);
    setEditCompany(contact.company);
    setEditMobile(contact.mobile);
    setEditEmail(contact.email || "");
    setEditAddress(contact.address || "");
    setEditNotes(contact.notes || "");
    setIsEditing(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    await contactService.updateContact({
      ...contact,
      name: editName.trim(),
      company: editCompany.trim(),
      mobile: editMobile.trim(),
      email: editEmail.trim() || undefined,
      address: editAddress.trim() || undefined,
      notes: editNotes.trim() || undefined,
    });
    await Promise.all([refreshData(), fetchContactDetail()]);
    setIsEditing(false);
  };

  const handleAddQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;

    setIsSavingNote(true);
    try {
      await noteService.createNote({
        contactId: contact.id,
        activityType: "general",
        note: quickNoteText.trim(),
      });
      await Promise.all([refreshData(), fetchContactDetail()]);
      setQuickNoteText("");
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleExportScheduleIcs = () => {
    if (contactActivities.length === 0) {
      toast("No scheduled activities for this contact", "info");
      return;
    }

    const icsContent = generateIcsContent(
      contactActivities.map((a) => ({
        id: a.id,
        title: `${a.type === "meeting" ? "Meeting" : "Follow-Up"}: ${a.title} (${contact.name})`,
        date: a.date,
        time: a.time,
        location: a.location,
        description: `Company: ${contact.company} · Mobile: ${contact.mobile}\n\nNotes: ${a.notes || ""}`,
      }))
    );
    downloadIcsFile(`${contact.name.toLowerCase().replace(/\s+/g, "_")}_schedule`, icsContent);
    toast("Calendar schedule exported (.ics)", "success");
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to all contacts
        </Link>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Avatar and Identity */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-md ${
                contact.avatarColor || "bg-indigo-600 text-white"
              }`}
            >
              {getInitials(contact.name)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                  {contact.name}
                </h1>
                <button
                  onClick={handleOpenEdit}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5 mt-1">
                <Building className="w-4 h-4 text-zinc-400" />
                {contact.company}
              </p>

              {contact.address && (
                <p className="text-xs text-zinc-500 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  {contact.address}
                </p>
              )}
            </div>
          </div>

          {/* Primary Action Buttons: Call, WhatsApp, Email */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => initiateCall(contact)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <Phone className="w-4 h-4 fill-current" />
              <span>Call Contact</span>
            </button>

            <button
              onClick={() => setIsWhatsAppOpen(true)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold text-xs border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Composer</span>
            </button>

            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            )}
          </div>
        </div>

        {/* Relationship Overview Notes */}
        {contact.notes && (
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">
              Context & Background Notes
            </h4>
            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
              {contact.notes}
            </p>
          </div>
        )}

        {/* Quick Activity Creator & Calendar Sync Bar */}
        <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => openQuickCreate("follow_up", contact.id)}
              className="text-xs"
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              + Schedule Follow-Up
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => openQuickCreate("meeting", contact.id)}
              className="text-xs"
            >
              <Video className="w-3.5 h-3.5 mr-1 text-blue-600" />
              + Schedule Meeting
            </Button>
          </div>

          <button
            onClick={handleExportScheduleIcs}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/40"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" />
            <span>Export Schedule (.ics)</span>
          </button>
        </div>
      </div>

      {/* AI Relationship Intelligence Card */}
      <AISummaryCard contactId={contact.id} />

      {/* Inline Quick Note Bar */}
      <form
        onSubmit={handleAddQuickNote}
        className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 items-center shadow-xs"
      >
        <Input
          placeholder="Add a quick note or key takeaway from your interaction..."
          value={quickNoteText}
          onChange={(e) => setQuickNoteText(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          size="sm"
          disabled={!quickNoteText.trim() || isSavingNote}
          isLoading={isSavingNote}
          className="w-full sm:w-auto shrink-0 text-xs"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add Note
        </Button>
      </form>

      {/* Tab Navigations */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "timeline"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          All History ({contactHistory.length})
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "activities"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          Meetings & Follow-Ups ({contactActivities.length})
        </button>
        <button
          onClick={() => setActiveTab("notes")}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === "notes"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          Notes ({contactNotes.length})
        </button>
      </div>

      {/* Tab Contents */}
      {/* 1. Complete Chronological History */}
      {activeTab === "timeline" && (
        <div className="space-y-4">
          {contactHistory.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-8 h-8 text-zinc-400" />}
              title="No interactions logged yet"
              description="Calls, notes, meetings, and rescheduled follow-ups will appear in this timeline."
            />
          ) : (
            <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6 ml-3">
              {contactHistory.map((item) => {
                let title = `${item.action} ${item.activityType}`;
                let badgeColor = "bg-zinc-100 text-zinc-700";

                if (item.action === "called") {
                  title = "Phone call placed";
                  badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                } else if (item.action === "note_added") {
                  title = "Note added";
                  badgeColor = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
                } else if (item.action === "completed") {
                  title = `${item.activityType === "meeting" ? "Meeting" : "Follow-up"} completed`;
                  badgeColor = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300";
                } else if (item.action === "rescheduled") {
                  title = `${item.activityType === "meeting" ? "Meeting" : "Follow-up"} rescheduled`;
                  badgeColor = "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300";
                } else if (item.action === "created") {
                  title = `New ${item.activityType} scheduled`;
                  badgeColor = "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300";
                }

                return (
                  <div key={item.id} className="relative group">
                    <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-indigo-600 flex items-center justify-center" />

                    <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${badgeColor}`}>
                            {title}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-medium">
                          {format(new Date(item.createdAt), "d MMM yyyy, h:mm a")}
                        </span>
                      </div>

                      {item.action === "rescheduled" && Boolean(item.previousData) && Boolean(item.newData) && (
                        <div className="mt-2 text-xs bg-purple-50/50 dark:bg-purple-950/20 p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/40 text-purple-900 dark:text-purple-300">
                          <p>
                            Originally scheduled: <span className="font-semibold">{String(item.previousData?.date || "")} at {String(item.previousData?.time || "")}</span>
                          </p>
                          <p className="mt-0.5">
                            Rescheduled to: <span className="font-bold">{String(item.newData?.date || "")} at {String(item.newData?.time || "")}</span>
                          </p>
                          {item.reason && <p className="mt-1 text-zinc-500 italic">Reason: &quot;{item.reason}&quot;</p>}
                        </div>
                      )}

                      {Boolean(item.newData && item.newData.snippet) && (
                        <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 italic">
                          &quot;{String(item.newData?.snippet)}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 2. Activities Tab */}
      {activeTab === "activities" && (
        <div className="space-y-3">
          {contactActivities.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-8 h-8 text-zinc-400" />}
              title="No activities for this contact"
              description="Schedule a meeting or follow-up to keep the conversation moving."
              action={
                <Button size="sm" onClick={() => openQuickCreate("follow_up", contact.id)}>
                  <Plus className="w-4 h-4 mr-1" />
                  + Schedule Follow-Up
                </Button>
              }
            />
          ) : (
            contactActivities.map((act) => (
              <ActivityCard
                key={act.id}
                activity={act}
                onReschedule={(target) => setRescheduleTarget(target)}
              />
            ))
          )}
        </div>
      )}

      {/* 3. Notes Tab */}
      {activeTab === "notes" && (
        <div className="space-y-3">
          {contactNotes.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-8 h-8 text-zinc-400" />}
              title="No notes yet"
              description="Add key takeaways, pricing requests, or requirements using the box above."
            />
          ) : (
            contactNotes.map((n) => (
              <div
                key={n.id}
                className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
                  <span className="capitalize font-semibold text-indigo-600 dark:text-indigo-400">
                    {n.activityType} Note
                  </span>
                  <span>{format(new Date(n.createdAt), "d MMM yyyy, h:mm a")}</span>
                </div>
                <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap">{n.note}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reschedule Modal */}
      <RescheduleModal
        activity={rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
      />

      {/* WhatsApp Modal */}
      <WhatsAppModal
        contact={contact}
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
      />

      {/* Edit Contact Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit Contact">
        <form onSubmit={handleSaveEdit} className="space-y-3 pt-2">
          <Input label="Full Name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
          <Input label="Company" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} required />
          <Input label="Mobile Number" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} required />
          <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
          <Input label="Office / City Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              Relationship Notes
            </label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
