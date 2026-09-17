"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Video,
  Plus,
  FileText,
  MessageSquare,
  X,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openQuickCreate, dashboardStats } = useDataStore();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const isHome = pathname === "/dashboard" || pathname === "/";
  const isFollowUps = pathname.startsWith("/follow-ups");
  const isContacts = pathname.startsWith("/contacts");
  const isCalendar = pathname.startsWith("/calendar");

  return (
    <>
      {/* Floating Action Drawer / Mobile Bottom Sheet */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden flex flex-col justify-end"
          onClick={() => setShowFabMenu(false)}
        >
          <div
            className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-5 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Notch */}
            <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto" />

            {/* Sheet Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Quick Actions
                </h3>
                <p className="text-xs text-zinc-500">What would you like to schedule or create?</p>
              </div>
              <button
                onClick={() => setShowFabMenu(false)}
                className="p-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Action Tiles */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("follow_up");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-950 dark:text-indigo-100">Schedule Follow-Up</p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">Call & check-in</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("meeting");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-950 dark:text-blue-100">Schedule Meeting</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Video / in-person</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("contact");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-950 dark:text-emerald-100">Add New Contact</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Client / lead info</p>
                </div>
              </button>

              <Link
                href="/notes"
                onClick={() => setShowFabMenu(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/80 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/30 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-black text-amber-950 dark:text-amber-100">Notes & Logs</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Capture takeaway</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Modern Native Dock Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-3 pb-3 pt-1 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/80 dark:border-zinc-800/80 rounded-3xl shadow-xl shadow-zinc-950/10 px-2 py-1.5 flex items-center justify-between">
          {/* Tab 1: Today */}
          <Link
            href="/dashboard"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-2xl transition-all ${
              isHome
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] tracking-tight leading-none">Today</span>
          </Link>

          {/* Tab 2: Follow-Ups */}
          <Link
            href="/follow-ups"
            className={`relative flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-2xl transition-all ${
              isFollowUps
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
            }`}
          >
            <div className="relative">
              <Clock className="w-5 h-5" />
              {dashboardStats.overdueActivities > 0 && (
                <span className="absolute -top-1 -right-2 min-w-3.5 h-3.5 px-1 rounded-full text-[9px] font-black bg-rose-500 text-white flex items-center justify-center animate-pulse">
                  {dashboardStats.overdueActivities}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight leading-none">Follow-Ups</span>
          </Link>

          {/* Center Action Button (FAB Docked) */}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            aria-label="Quick Create Activity"
            className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-all cursor-pointer -my-2 mx-1 shrink-0"
          >
            <Plus className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${showFabMenu ? "rotate-45" : ""}`} />
          </button>

          {/* Tab 3: Contacts */}
          <Link
            href="/contacts"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-2xl transition-all ${
              isContacts
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] tracking-tight leading-none">Contacts</span>
          </Link>

          {/* Tab 4: Calendar */}
          <Link
            href="/calendar"
            className={`flex flex-col items-center justify-center gap-0.5 w-14 py-1 rounded-2xl transition-all ${
              isCalendar
                ? "text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] tracking-tight leading-none">Calendar</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
