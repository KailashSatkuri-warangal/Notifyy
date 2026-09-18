"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { useDataStore } from "@/hooks/useDataStore";
import { useToast } from "@/components/ui/Toast";
import { getTodayDateString, getCurrentTimeString, formatActivityTime } from "@/lib/date-utils";
import { REMINDER_OPTIONS } from "@/lib/constants";
import { ReminderOffset } from "@/types";
import { Users, Video, Clock } from "lucide-react";

export function QuickCreateModal() {
  const {
    quickCreateType,
    quickCreateContactId,
    closeQuickCreate,
    contacts,
    refreshData,
    settings,
  } = useDataStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"meeting" | "follow_up" | "contact">("follow_up");
  const [selectedContactId, setSelectedContactId] = useState<string>("");

  // Contact Form States
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Activity Form States
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [reminder, setReminder] = useState<ReminderOffset>(settings.defaultReminder || "at_time");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (quickCreateType) {
      setActiveTab(quickCreateType);
    }
    if (quickCreateContactId) {
      setSelectedContactId(quickCreateContactId);
    } else if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].id);
    }
  }, [quickCreateType, quickCreateContactId, contacts, selectedContactId]);

  if (!quickCreateType) return null;

  const resetForms = () => {
    setName("");
    setCompany("");
    setMobile("");
    setEmail("");
    setAddress("");
    setTitle("");
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setLocation("");
    setPurpose("");
    setNotes("");
    setFormError("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);

    try {
      if (activeTab === "contact") {
        if (!name.trim() || !mobile.trim() || !company.trim()) {
          setFormError("Name, Company, and Mobile number are required.");
          setIsSaving(false);
          return;
        }

        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, company, mobile, email, address, notes }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast(`Contact "${name}" created!`, "success");
      } else if (activeTab === "meeting") {
        if (!selectedContactId || !title.trim() || !date || !time) {
          setFormError("Please select a contact and specify title, date, and time.");
          setIsSaving(false);
          return;
        }

        const res = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId: selectedContactId,
            title,
            date,
            time,
            location,
            purpose,
            notes,
            reminder,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast(`Meeting scheduled for ${date}!`, "success");
      } else if (activeTab === "follow_up") {
        if (!selectedContactId || !title.trim() || !date || !time) {
          setFormError("Please select a contact and specify title, date, and time.");
          setIsSaving(false);
          return;
        }

        const res = await fetch("/api/follow-ups", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contactId: selectedContactId,
            title,
            date,
            time,
            notes,
            reminder,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        toast(`Follow-Up scheduled for ${date}!`, "success");
      }

      await refreshData();
      resetForms();
      closeQuickCreate();
    } catch (err: any) {
      setFormError(err.message || "Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={!!quickCreateType} onClose={closeQuickCreate} maxWidth="lg">
      <div className="flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("follow_up")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "follow_up"
              ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Follow-Up</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("meeting")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "meeting"
              ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>Meeting</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === "contact"
              ? "bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Contact</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 text-xs font-semibold">
            {formError}
          </div>
        )}

        {activeTab === "contact" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                placeholder="e.g. Rajesh Kumar"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Company *"
                placeholder="e.g. ABC Industries"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Mobile Number *"
                placeholder="e.g. +91 98201 45678"
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
              <Input
                label="Email"
                placeholder="rajesh@abc.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Input
              label="Office / City Address"
              placeholder="e.g. Bandra Kurla Complex, Mumbai"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Key Notes / Relationship Context
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Important context, preferences, role details..."
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </>
        )}

        {activeTab !== "contact" && (
          <>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                Select Contact *
              </label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 font-medium focus:border-indigo-500 focus:outline-none"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.company} ({c.mobile})
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={activeTab === "meeting" ? "Meeting Title *" : "Follow-Up Objective *"}
              placeholder={
                activeTab === "meeting"
                  ? "e.g. Q4 ERP Implementation Scope & Signoff"
                  : "e.g. Call to discuss quotation discount and next steps"
              }
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                label="Date *"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div>
                <Input
                  type="time"
                  label={`Time * (${formatActivityTime(time) || "Set Time"})`}
                  required
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Quick Time Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] text-zinc-400 font-semibold shrink-0">Quick Time:</span>
              {["09:00", "10:00", "11:00", "14:00", "16:00", "18:00"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTime(preset)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors shrink-0 ${
                    time === preset
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400"
                  }`}
                >
                  {formatActivityTime(preset)}
                </button>
              ))}
            </div>

            {activeTab === "meeting" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Location / Link"
                  placeholder="e.g. Google Meet / Bandra HQ"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Input
                  label="Purpose / Goal"
                  placeholder="e.g. Finalize contract signoff"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Reminder Alert
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value as ReminderOffset)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add meeting agenda, documents needed, key background..."
                className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2.5 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button type="button" variant="outline" onClick={closeQuickCreate}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSaving}>
            Save {activeTab === "contact" ? "Contact" : activeTab === "meeting" ? "Meeting" : "Follow-Up"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
