"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileBottomNav } from "./MobileNav";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { PostCallPromptModal } from "@/components/activities/PostCallPromptModal";
import { AfterCompletionPromptModal } from "@/components/activities/AfterCompletionPromptModal";
import { QuickCreateModal } from "@/components/activities/QuickCreateModal";
import { ToastProvider } from "@/components/ui/Toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDataStore } from "@/hooks/useDataStore";

import { NotifyyLogo } from "@/components/ui";

import { LiveTimerBanner } from "@/components/notifications/LiveTimerBanner";

export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();
  const pathname = usePathname();
  const { isInitialized } = useDataStore();

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("Notifyy Service Worker registered:", reg.scope))
        .catch((err) => console.error("Service Worker registration failed:", err));
    }
  }, []);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <NotifyyLogo size="xl" className="mx-auto animate-pulse" />
          <h2 className="text-base font-bold text-zinc-800 dark:text-zinc-200">Notifyy</h2>
          <p className="text-xs text-zinc-500">Connecting to database...</p>
        </div>
      </div>
    );
  }

  if (isAuthPage) {
    return (
      <ToastProvider>
        <main>{children}</main>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-10">
          <TopBar />
          <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
            <LiveTimerBanner />
            {children}
          </main>
        </div>

        <MobileBottomNav />

        <GlobalSearchModal />
        <PostCallPromptModal />
        <AfterCompletionPromptModal />
        <QuickCreateModal />
      </div>
    </ToastProvider>
  );
}
