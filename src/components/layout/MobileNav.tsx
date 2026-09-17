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
  Bell,
  Settings,
} from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openQuickCreate, dashboardStats, unreadNotificationCount } = useDataStore();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const navItems = [
    {
      label: "Today",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: dashboardStats.todayMeetings + dashboardStats.todayFollowUps,
    },
    {
      label: "Follow-Ups",
      href: "/follow-ups",
      icon: Clock,
      badge: dashboardStats.overdueActivities,
      badgeColor: "bg-rose-500 text-white",
    },
    {
      label: "Meetings",
      href: "/meetings",
      icon: Video,
      badge: dashboardStats.todayMeetings,
    },
    {
      label: "Contacts",
      href: "/contacts",
      icon: Users,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: Calendar,
    },
  ];

  return (
    <>
      {/* Floating Action Drawer / Bottom Sheet Overlay */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden flex flex-col justify-end"
          onClick={() => setShowFabMenu(false)}
        >
          <div
            className="w-full bg-white dark:bg-zinc-900 rounded-t-3xl p-6 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Quick Create Action
                </h3>
                <p className="text-xs text-zinc-500">
                  Schedule activities, add contacts, or log interaction notes
                </p>
              </div>
              <button
                onClick={() => setShowFabMenu(false)}
                className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Grid Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("follow_up");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-900/60 font-bold text-xs active:scale-98 transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-950 dark:text-indigo-100">Follow-Up</p>
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">Call & check-in</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("meeting");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-900/60 font-bold text-xs active:scale-98 transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-xs shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-blue-950 dark:text-blue-100">Meeting</p>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400 font-normal">Video & in-person</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowFabMenu(false);
                  openQuickCreate("contact");
                }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-900/60 font-bold text-xs active:scale-98 transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950 dark:text-emerald-100">Contact</p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">Add new lead</p>
                </div>
              </button>

              <Link
                href="/notes"
                onClick={() => setShowFabMenu(false)}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60 font-bold text-xs active:scale-98 transition-all text-left cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-xs shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-950 dark:text-amber-100">Notes Log</p>
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">View & add notes</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) positioned above the bottom bar */}
      <button
        onClick={() => setShowFabMenu(!showFabMenu)}
        aria-label="Quick Create Activity or Contact"
        className="fixed bottom-19 right-4 z-40 lg:hidden w-13 h-13 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 active:scale-95 transition-all cursor-pointer border-2 border-white dark:border-zinc-900"
      >
        <Plus className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${showFabMenu ? "rotate-45" : ""}`} />
      </button>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {Boolean(item.badge && item.badge > 0) && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                      item.badgeColor || "bg-indigo-600 text-white"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
