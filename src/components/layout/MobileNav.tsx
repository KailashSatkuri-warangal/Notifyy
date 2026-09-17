"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Clock,
  Video,
  Plus,
  FileText,
  X,
  Zap,
} from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openQuickCreate, dashboardStats } = useDataStore();
  const [showFabMenu, setShowFabMenu] = useState(false);

  // Determine active tab
  let activeTab = "today";
  if (pathname.startsWith("/follow-ups")) activeTab = "follow_ups";
  else if (pathname.startsWith("/contacts")) activeTab = "contacts";
  else if (pathname.startsWith("/calendar")) activeTab = "calendar";
  else if (pathname === "/dashboard" || pathname === "/") activeTab = "today";
  else activeTab = "";

  const navTabs = [
    { id: "today", label: "Today", href: "/dashboard", icon: LayoutDashboard },
    {
      id: "follow_ups",
      label: "Follow-Ups",
      href: "/follow-ups",
      icon: Clock,
      badge: dashboardStats.overdueActivities > 0 ? dashboardStats.overdueActivities : null,
    },
    { id: "contacts", label: "Contacts", href: "/contacts", icon: Users },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: Calendar },
  ];

  return (
    <>
      {/* Floating Action Drawer / Mobile Bottom Sheet */}
      <AnimatePresence>
        {showFabMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs lg:hidden flex flex-col justify-end"
            onClick={() => setShowFabMenu(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="w-full bg-white dark:bg-zinc-900 rounded-t-[32px] p-5 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* iOS Grab Notch */}
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50/90 hover:bg-indigo-100/90 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50/90 hover:bg-blue-100/90 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 border border-blue-200 dark:border-blue-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50/90 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
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
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/90 hover:bg-amber-100/90 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60 text-left transition-all active:scale-95 cursor-pointer shadow-xs"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iPhone Floating Glass Dock Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden px-3.5 pb-4 pt-1 pointer-events-none">
        <nav className="pointer-events-auto mx-auto max-w-sm bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/80 rounded-[28px] shadow-2xl shadow-zinc-950/15 p-1.5 flex items-center justify-between relative">
          {/* Left Tabs (Today, Follow-Ups) */}
          {navTabs.slice(0, 2).map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-colors select-none z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-glass-pill"
                    className="absolute inset-0 bg-white/95 dark:bg-zinc-800/90 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60 -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 scale-105"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  />
                  {tab.badge && (
                    <span className="absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[9px] font-black bg-rose-500 text-white flex items-center justify-center shadow-xs animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] tracking-tight leading-none mt-1 transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-zinc-500 dark:text-zinc-400 font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}

          {/* Center Floating Action Button (FAB) */}
          <div className="px-1 z-10">
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowFabMenu(!showFabMenu)}
              aria-label="Quick Create Activity"
              className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 cursor-pointer"
            >
              <Plus
                className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${
                  showFabMenu ? "rotate-45" : ""
                }`}
              />
            </motion.button>
          </div>

          {/* Right Tabs (Contacts, Calendar) */}
          {navTabs.slice(2, 4).map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-colors select-none z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="active-glass-pill"
                    className="absolute inset-0 bg-white/95 dark:bg-zinc-800/90 rounded-2xl shadow-sm border border-zinc-200/80 dark:border-zinc-700/60 -z-10"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 scale-105"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10px] tracking-tight leading-none mt-1 transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400 font-bold"
                      : "text-zinc-500 dark:text-zinc-400 font-medium"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
