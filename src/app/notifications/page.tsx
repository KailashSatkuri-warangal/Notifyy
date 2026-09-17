"use client";

import { useState, useEffect } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { notificationService } from "@/services/NotificationService";
import { Button, EmptyState } from "@/components/ui";
import {
  Bell,
  CheckCheck,
  Trash2,
  Send,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Video,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function NotificationsPage() {
  const { notifications, refreshData } = useDataStore();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    notificationService.getPermissionStatus().then((p) => setPermission(p));
  }, []);

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setPermission(res);
  };

  const handleSendTestNotification = async () => {
    setIsSendingTest(true);
    try {
      await notificationService.createInAppNotification({
        type: "system",
        title: "Test Alert from Notifyy",
        message: "Your notifications and reminders are active and functioning properly!",
      });
      await refreshData();
    } catch (err) {
      console.error("Test notification failed", err);
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead();
    await refreshData();
  };

  const handleClearAll = async () => {
    if (confirm("Clear all notifications?")) {
      await notificationService.clearAll();
      await refreshData();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
            Notification Center
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold">
              {notifications.length}
            </span>
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            System briefings, upcoming schedule alerts, and overdue follow-up reminders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs">
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Mark All Read
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs text-rose-500 hover:text-rose-600">
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Permission & Test Notification Card */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-2xl ${
              permission === "granted"
                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}
          >
            {permission === "granted" ? <ShieldCheck className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Browser Permissions: <span className="capitalize">{permission}</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {permission === "granted"
                ? "Push and local desktop reminders will notify you on time."
                : "Enable notifications so you never miss scheduled follow-ups."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {permission !== "granted" && permission !== "unsupported" && (
            <Button size="sm" onClick={handleRequestPermission} className="text-xs w-full sm:w-auto">
              Enable Notifications
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSendTestNotification}
            isLoading={isSendingTest}
            className="text-xs w-full sm:w-auto"
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Send Test Alert
          </Button>
        </div>
      </div>

      {/* Notifications Feed */}
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-zinc-400" />}
          title="No notifications"
          description="You are completely caught up! New reminders and schedule alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            let icon = <Bell className="w-4 h-4 text-zinc-400" />;
            if (n.type === "meeting_reminder") icon = <Video className="w-4 h-4 text-blue-500" />;
            if (n.type === "followup_reminder") icon = <Clock className="w-4 h-4 text-indigo-500" />;
            if (n.type === "overdue_alert") icon = <AlertCircle className="w-4 h-4 text-rose-500" />;

            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  n.isRead
                    ? "bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 opacity-75"
                    : "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 mt-0.5">{icon}</div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{n.title}</h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">{n.message}</p>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      {format(new Date(n.timestamp), "d MMM yyyy · h:mm a")}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={async () => {
                      await notificationService.markAsRead(n.id);
                      await refreshData();
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    Mark read
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
