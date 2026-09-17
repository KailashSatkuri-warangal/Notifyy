"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, Users, MoreHorizontal, Plus } from "lucide-react";
import { useDataStore } from "@/hooks/useDataStore";
import { useState } from "react";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openQuickCreate } = useDataStore();
  const [showFabMenu, setShowFabMenu] = useState(false);

  const navItems = [
    { label: "Home", href: "/dashboard", icon: LayoutDashboard },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "Contacts", href: "/contacts", icon: Users },
    { label: "More", href: "/settings", icon: MoreHorizontal },
  ];

  return (
    <>
      {/* Floating Action Menu Overlay */}
      {showFabMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity lg:hidden"
          onClick={() => setShowFabMenu(false)}
        >
          <div
            className="absolute bottom-24 right-6 flex flex-col gap-2.5 items-end animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowFabMenu(false);
                openQuickCreate("meeting");
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-xs active:scale-95 transition-all"
            >
              <span>+ New Meeting</span>
            </button>
            <button
              onClick={() => {
                setShowFabMenu(false);
                openQuickCreate("follow_up");
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xl border border-zinc-200 dark:border-zinc-700 font-semibold text-xs active:scale-95 transition-all"
            >
              <span>+ New Follow-Up</span>
            </button>
            <button
              onClick={() => {
                setShowFabMenu(false);
                openQuickCreate("contact");
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-indigo-600 text-white shadow-xl font-semibold text-xs active:scale-95 transition-all"
            >
              <span>+ New Contact</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Quick Action FAB */}
      <button
        onClick={() => setShowFabMenu(!showFabMenu)}
        aria-label="Quick Create Activity or Contact"
        className="fixed bottom-20 right-5 z-40 lg:hidden w-13 h-13 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-all cursor-pointer"
      >
        <Plus className={`w-6 h-6 stroke-[2.5] transition-transform duration-200 ${showFabMenu ? "rotate-45" : ""}`} />
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-around safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 font-medium"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
