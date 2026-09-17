"use client";

import { Search, Plus, Bell, WifiOff, Settings } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getGreeting, format } from "@/lib/date-utils";
import { ThemeToggle } from "./ThemeToggle";
import { getInitials } from "@/lib/utils";

export function TopBar() {
  const { openSearch, openQuickCreate, unreadNotificationCount, user } = useDataStore();
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
    <header className="sticky top-0 z-20 w-full bg-white/85 dark:bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-200/80 dark:border-zinc-800/80 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between transition-colors">
      {/* Left: Brand Identity & Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mobile Brand Icon */}
        <Link
          href="/dashboard"
          className="lg:hidden w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-600/30 shrink-0"
        >
          N
        </Link>

        <div>
          <h2 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white flex items-center gap-1.5 leading-tight">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"}
          </h2>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            {format(new Date(), "EEE, d MMM")}
          </p>
        </div>
      </div>

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {!isOnline && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
            <WifiOff className="w-3 h-3" />
            <span className="hidden xs:inline">Offline</span>
          </div>
        )}

        {/* Search Pill */}
        <button
          onClick={openSearch}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-semibold transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 text-zinc-400" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[10px] font-semibold text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <Link
          href="/notifications"
          aria-label="View notifications"
          className="relative p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
          )}
        </Link>

        {/* Theme Toggle (Compact) */}
        <ThemeToggle />

        {/* User Profile Avatar Pill */}
        <Link
          href="/settings"
          title="Account Settings"
          className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-bold transition-colors border border-zinc-200 dark:border-zinc-700"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center">
            {getInitials(user?.name || "User")}
          </div>
          <Settings className="w-3.5 h-3.5 text-zinc-400 hidden sm:inline" />
        </Link>
      </div>
    </header>
  );
}
