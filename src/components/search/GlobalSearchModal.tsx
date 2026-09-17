"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui";
import { useDataStore } from "@/hooks/useDataStore";
import { searchService, SearchResults } from "@/services/SearchService";
import { Search, Users, Video, Clock, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatActivityDate, formatActivityTime } from "@/lib/date-utils";

export function GlobalSearchModal() {
  const { isSearchOpen, closeSearch } = useDataStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({
    contacts: [],
    meetings: [],
    followUps: [],
    notes: [],
    totalCount: 0,
  });

  useEffect(() => {
    if (!query.trim()) {
      setResults({ contacts: [], meetings: [], followUps: [], notes: [], totalCount: 0 });
      return;
    }

    const handler = setTimeout(async () => {
      const res = await searchService.search(query);
      setResults(res);
    }, 150);

    return () => clearTimeout(handler);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <Modal isOpen={isSearchOpen} onClose={closeSearch} maxWidth="2xl">
      {/* Search Input Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-3.5 w-5 h-5 text-zinc-400" />
        <input
          autoFocus
          type="text"
          placeholder="Search contacts, companies, meetings, follow-ups, notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Results View */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
        {query && results.totalCount === 0 && (
          <div className="py-8 text-center text-sm text-zinc-500">
            No matches found for &quot;<span className="font-semibold">{query}</span>&quot;
          </div>
        )}

        {/* Contacts */}
        {results.contacts.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              <Users className="w-3.5 h-3.5 text-indigo-500" />
              <span>Contacts ({results.contacts.length})</span>
            </div>
            <div className="space-y-1">
              {results.contacts.map((c) => (
                <Link
                  key={c.id}
                  href={`/contacts/${c.id}`}
                  onClick={closeSearch}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600">
                      {c.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {c.company} · {c.mobile}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Meetings */}
        {results.meetings.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              <Video className="w-3.5 h-3.5 text-blue-500" />
              <span>Meetings ({results.meetings.length})</span>
            </div>
            <div className="space-y-1">
              {results.meetings.map((m) => (
                <Link
                  key={m.id}
                  href="/meetings"
                  onClick={closeSearch}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600">
                      {m.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {m.contactName} ({m.contactCompany}) · {formatActivityDate(m.date)} at {formatActivityTime(m.time)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Follow-Ups */}
        {results.followUps.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>Follow-Ups ({results.followUps.length})</span>
            </div>
            <div className="space-y-1">
              {results.followUps.map((f) => (
                <Link
                  key={f.id}
                  href="/follow-ups"
                  onClick={closeSearch}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600">
                      {f.title}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {f.contactName} ({f.contactCompany}) · {formatActivityDate(f.date)} at {formatActivityTime(f.time)}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {results.notes.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Notes ({results.notes.length})</span>
            </div>
            <div className="space-y-1">
              {results.notes.map((n) => (
                <Link
                  key={n.id}
                  href={`/contacts/${n.contactId}`}
                  onClick={closeSearch}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group"
                >
                  <div>
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {n.contactName}
                    </p>
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 line-clamp-1">{n.note}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
