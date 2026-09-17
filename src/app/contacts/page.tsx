"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { useCallAction } from "@/hooks/useCallAction";
import { Contact } from "@/types";
import { Button, Input, EmptyState, Badge } from "@/components/ui";
import { Users, Search, Phone, Plus, Building, Mail, Calendar, ArrowUpRight, Clock, AlertCircle } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { formatActivityDate } from "@/lib/date-utils";
import Link from "next/link";

export default function ContactsPage() {
  const { contacts, openQuickCreate, unifiedActivities } = useDataStore();
  const { initiateCall } = useCallAction();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "recent_contacted" | "has_followup" | "overdue">("all");

  // Activity lookup by contact
  const activityMap = new Map<string, typeof unifiedActivities>();
  unifiedActivities.forEach((act) => {
    const list = activityMap.get(act.contactId) || [];
    list.push(act);
    activityMap.set(act.contactId, list);
  });

  const filteredContacts = contacts.filter((c) => {
    if (c.isArchived) return false;
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const match =
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.email && c.email.toLowerCase().includes(q));
      if (!match) return false;
    }

    const cActs = activityMap.get(c.id) || [];
    if (activeFilter === "recent_contacted") {
      return !!c.lastContactedAt;
    }
    if (activeFilter === "has_followup") {
      return cActs.some((a) => a.type === "follow_up" && a.status === "pending");
    }
    if (activeFilter === "overdue") {
      return cActs.some((a) => a.status === "overdue");
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Contacts Directory
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold">
              {contacts.length}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage your client relationships, follow-up history, and direct calling
          </p>
        </div>

        <Button onClick={() => openQuickCreate("contact")}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New Contact
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="w-full sm:max-w-md">
          <Input
            placeholder="Search by name, company, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "all"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            All ({contacts.length})
          </button>
          <button
            onClick={() => setActiveFilter("recent_contacted")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "recent_contacted"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Recently Contacted
          </button>
          <button
            onClick={() => setActiveFilter("has_followup")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "has_followup"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Upcoming Follow-Up
          </button>
          <button
            onClick={() => setActiveFilter("overdue")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === "overdue"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
            }`}
          >
            Overdue
          </button>
        </div>
      </div>

      {/* Contact Cards Grid */}
      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-zinc-400" />}
          title="No contacts found"
          description={
            searchQuery
              ? `No contacts match "${searchQuery}". Try a different search term.`
              : "Add your first contact to start managing meetings, calls, and follow-ups."
          }
          action={
            <Button size="sm" onClick={() => openQuickCreate("contact")}>
              <Plus className="w-4 h-4 mr-1" />
              Add Contact
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => {
            const acts = activityMap.get(contact.id) || [];
            const nextPending = acts.find((a) => a.status === "pending" || a.status === "overdue");
            const hasOverdue = acts.some((a) => a.status === "overdue");

            return (
              <div
                key={contact.id}
                className="group relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Avatar & Name Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm shadow-xs ${
                          contact.avatarColor || "bg-indigo-600 text-white"
                        }`}
                      >
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-base font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1 leading-snug"
                        >
                          {contact.name}
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                        <p className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-zinc-400" />
                          {contact.company}
                        </p>
                      </div>
                    </div>

                    {/* Quick Call Button */}
                    <button
                      onClick={() => initiateCall(contact)}
                      title={`Call ${contact.name}`}
                      className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                    >
                      <Phone className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Phone & Email */}
                  <div className="mt-4 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{contact.mobile}</span>
                    </div>
                    {contact.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Next Activity or Overdue Alert */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs">
                    {hasOverdue ? (
                      <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Overdue follow-up needs attention</span>
                      </div>
                    ) : nextPending ? (
                      <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                        <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate font-medium">
                          Next: {nextPending.title} ({formatActivityDate(nextPending.date)})
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400">No pending activities</span>
                    )}
                  </div>
                </div>

                {/* Bottom Card Actions */}
                <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View History & Notes →
                  </Link>

                  <button
                    onClick={() => openQuickCreate("follow_up", contact.id)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    + Follow-Up
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
