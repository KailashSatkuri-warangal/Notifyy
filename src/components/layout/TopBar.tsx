"use client";

import { Search, Plus, Bell, Wifi, WifiOff, LogOut } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getGreeting, format } from "@/lib/date-utils";

export function TopBar() {
  const { openSearch, openQuickCreate, unreadNotificationCount, user, logout } = useDataStore();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <div className="lg:hidden w-8 h-8 rounded-lg bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
          N
        </div>
        <div>
          <h2 className="text-sm lg:text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {!isOnline && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-800">
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline Mode</span>
          </div>
        )}

        <button
          onClick={openSearch}
          className="flex items-center gap-2.5 px-3 py-1.5 sm:py-2 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm font-medium transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          <Search className="w-4 h-4 text-zinc-400" />
          <span className="hidden md:inline">Search contacts, meetings, notes...</span>
          <span className="md:hidden">Search</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-2xs">
            ⌘K
          </kbd>
        </button>

        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
          )}
        </Link>

        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => openQuickCreate("follow_up")}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Follow-Up</span>
          </button>
          <button
            onClick={() => openQuickCreate("meeting")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold transition-all active:scale-[0.98] border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            <span>+ Meeting</span>
          </button>
        </div>
      </div>
    </header>
  );
}
