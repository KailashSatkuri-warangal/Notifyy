"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDataStore } from "./useDataStore";
import { UnifiedActivity } from "@/types";
import {
  playNotificationSound,
  startAlarmRing,
  stopAlarmRing,
  getIsAlarmRinging,
  triggerDeviceVibration,
} from "@/lib/sound-utils";
import { notificationService } from "@/services/NotificationService";
import { isToday } from "date-fns";

const NOTIFIED_CACHE_KEY = "notifyy_notified_alarms_v1";
const COMPLETED_BLACKLIST_KEY = "notifyy_completed_reminders_v1";

export interface ActiveTimerInfo {
  activity: UnifiedActivity;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  formattedCountdown: string;
  isOverdue: boolean;
  isDueNow: boolean;
  isRinging: boolean;
}

export function useActivityReminders() {
  const { unifiedActivities, refreshData } = useDataStore();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [dismissedActivityIds, setDismissedActivityIds] = useState<Set<string>>(new Set());
  const [ringingActivityId, setRingingActivityId] = useState<string | null>(null);

  // Initialize persistent deduplication caches
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedNotified = localStorage.getItem(NOTIFIED_CACHE_KEY);
      if (storedNotified) {
        const parsed = JSON.parse(storedNotified);
        if (Array.isArray(parsed)) {
          parsed.forEach((k: string) => notifiedIdsRef.current.add(k));
        }
      }

      const storedCompleted = localStorage.getItem(COMPLETED_BLACKLIST_KEY);
      if (storedCompleted) {
        const parsed = JSON.parse(storedCompleted);
        if (Array.isArray(parsed)) {
          setCompletedIds(new Set(parsed));
        }
      }
    } catch (_) {}
  }, []);

  // Update clock every second with Web Worker fallback to prevent mobile background throttling
  useEffect(() => {
    let worker: Worker | null = null;
    try {
      if (typeof window !== "undefined" && "Worker" in window) {
        worker = new Worker("/reminder-worker.js");
        worker.postMessage({ type: "START", interval: 1000 });
        worker.onmessage = (e) => {
          if (e.data?.type === "TICK") {
            setCurrentTime(new Date());
          }
        };
      }
    } catch (_) {}

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
      if (worker) {
        worker.postMessage({ type: "STOP" });
        worker.terminate();
      }
    };
  }, []);

  // Filter strictly pending/active activities, excluding completed/cancelled or blacklisted
  const pendingActivities = useMemo(() => {
    return unifiedActivities
      .filter((a) => {
        if (completedIds.has(a.id)) return false;
        if (a.status === "completed" || a.status === "cancelled" || a.status === "rescheduled") return false;
        return a.status === "pending" || a.status === "overdue";
      })
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [unifiedActivities, completedIds]);

  // Find the most urgent activity (upcoming in next 45 mins OR overdue today)
  const activeTimer = useMemo<ActiveTimerInfo | null>(() => {
    const nowMs = currentTime.getTime();

    for (const act of pendingActivities) {
      if (dismissedActivityIds.has(act.id)) continue;
      if (completedIds.has(act.id)) continue;

      const actMs = act.dateTime.getTime();
      const diffMs = actMs - nowMs;
      const totalSec = Math.floor(diffMs / 1000);

      const isOverdue = totalSec < 0;
      const overdueHours = Math.abs(totalSec) / 3600;

      // 1. Upcoming in the next 45 minutes
      if (!isOverdue && totalSec <= 45 * 60) {
        const mins = Math.floor(totalSec / 60);
        const secs = Math.abs(totalSec % 60);
        const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        return {
          activity: act,
          minutesRemaining: mins,
          secondsRemaining: secs,
          totalSecondsRemaining: totalSec,
          formattedCountdown: formatted,
          isOverdue: false,
          isDueNow: totalSec <= 60 && totalSec >= 0,
          isRinging: ringingActivityId === act.id,
        };
      } else if (isOverdue && isToday(act.dateTime) && overdueHours <= 4) {
        // 2. Overdue activity today: NO negative countdown digits!
        return {
          activity: act,
          minutesRemaining: 0,
          secondsRemaining: 0,
          totalSecondsRemaining: totalSec,
          formattedCountdown: "",
          isOverdue: true,
          isDueNow: false,
          isRinging: ringingActivityId === act.id,
        };
      }
    }

    return null;
  }, [pendingActivities, currentTime, dismissedActivityIds, completedIds, ringingActivityId]);

  const silenceAlarm = useCallback(() => {
    stopAlarmRing();
    setRingingActivityId(null);
  }, []);

  const dismissTimer = useCallback((activityId: string) => {
    silenceAlarm();
    setDismissedActivityIds((prev) => new Set([...prev, activityId]));
    notificationService.closeNotification(`notifyy-activity-${activityId}`);
    notificationService.closeNotification(`${activityId}-now`);
  }, [silenceAlarm]);

  // Automated Alarm & Notification triggers
  useEffect(() => {
    const nowMs = currentTime.getTime();

    pendingActivities.forEach((act) => {
      if (completedIds.has(act.id)) return;

      const actMs = act.dateTime.getTime();
      const diffMs = actMs - nowMs;
      const diffMins = Math.floor(diffMs / (1000 * 60));

      // 1. 15-Minute Advance Heads Up
      const key15m = `${act.id}-15m`;
      if (diffMins <= 15 && diffMins > 1 && !notifiedIdsRef.current.has(key15m)) {
        notifiedIdsRef.current.add(key15m);
        try {
          localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(notifiedIdsRef.current)));
        } catch (_) {}

        playNotificationSound("chime");
        triggerDeviceVibration([150, 80, 150]);

        notificationService.showBrowserNotification(
          `Upcoming: ${act.title}`,
          {
            body: `Starts in ${diffMins} minutes with ${act.contactName} (${act.contactCompany})`,
            tag: key15m,
          }
        );

        notificationService
          .createInAppNotification({
            type: act.type === "meeting" ? "meeting_reminder" : "followup_reminder",
            title: `Upcoming ${act.type === "meeting" ? "Meeting" : "Follow-Up"} in ${diffMins}m`,
            message: `${act.title} with ${act.contactName} (${act.contactCompany}) is scheduled for ${act.time}.`,
            activityId: act.id,
            activityType: act.type,
            contactId: act.contactId,
          })
          .then(() => refreshData())
          .catch(() => {});
      }

      // 2. Exact Time / Due Now Warning (0 - 1 minute) -> LOUD CONTINUOUS ALARM RING
      const keyNow = `${act.id}-now`;
      if (diffMins <= 0 && diffMins >= -2 && !notifiedIdsRef.current.has(keyNow)) {
        notifiedIdsRef.current.add(keyNow);
        try {
          localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(notifiedIdsRef.current)));
        } catch (_) {}

        setRingingActivityId(act.id);

        // Continuous pulsing alarm tone + screen wake notification
        startAlarmRing(60);

        notificationService.showBrowserNotification(
          `⏰ Due: ${act.title}`,
          {
            body: `With ${act.contactName} (${act.contactCompany || act.contactMobile || "Client"}) · Scheduled at ${act.time}`,
            tag: `notifyy-activity-${act.id}`,
            requireInteraction: true,
            data: {
              activityId: act.id,
              activityType: act.type,
              contactMobile: act.contactMobile || "",
              contactName: act.contactName || "",
              contactId: act.contactId || "",
              url: `/contacts/${act.contactId}`,
            },
            actions: [
              { action: "call", title: "📞 Call" },
              { action: "complete", title: "✅ Complete" },
              { action: "snooze", title: "⏱️ Snooze (5m)" },
            ],
          } as any
        );

        notificationService
          .createInAppNotification({
            type: act.type === "meeting" ? "meeting_reminder" : "followup_reminder",
            title: `⏰ Due Now: ${act.title}`,
            message: `${act.type === "meeting" ? "Meeting" : "Follow-up call"} with ${act.contactName} (${act.contactMobile || act.contactCompany}) is starting now.`,
            activityId: act.id,
            activityType: act.type,
            contactId: act.contactId,
          })
          .then(() => refreshData())
          .catch(() => {});
      }
    });
  }, [pendingActivities, currentTime, completedIds, refreshData]);

  // Complete Activity: fully cancel alarm and never trigger again
  const completeActivity = useCallback(async (activity: UnifiedActivity) => {
    silenceAlarm();
    dismissTimer(activity.id);

    // Add to completed blacklist immediately
    setCompletedIds((prev) => {
      const next = new Set([...prev, activity.id]);
      try {
        localStorage.setItem(COMPLETED_BLACKLIST_KEY, JSON.stringify(Array.from(next)));
      } catch (_) {}
      return next;
    });

    // Close any active browser notification for this activity
    notificationService.closeNotification(`notifyy-activity-${activity.id}`);
    notificationService.closeNotification(`${activity.id}-now`);
    notificationService.closeNotification(`${activity.id}-15m`);

    try {
      const endpoint = activity.type === "meeting"
        ? `/api/meetings/${activity.id}/complete`
        : `/api/follow-ups/${activity.id}/complete`;
      await fetch(endpoint, { method: "POST" });
      await refreshData();
    } catch (e) {
      console.error("Failed to complete activity", e);
    }
  }, [silenceAlarm, dismissTimer, refreshData]);

  // Snooze Activity: postpone for specified minutes and re-arm alarm
  const snoozeActivity = useCallback(async (activity: UnifiedActivity, minutes: number = 5) => {
    silenceAlarm();
    dismissTimer(activity.id);

    // Remove from notified cache so it can fire afresh when the snoozed time arrives
    notifiedIdsRef.current.delete(`${activity.id}-now`);
    try {
      localStorage.setItem(NOTIFIED_CACHE_KEY, JSON.stringify(Array.from(notifiedIdsRef.current)));
    } catch (_) {}

    notificationService.closeNotification(`notifyy-activity-${activity.id}`);

    try {
      const snoozeDate = new Date(Date.now() + minutes * 60 * 1000);
      const newDate = snoozeDate.toISOString().split("T")[0];
      const newTime = `${String(snoozeDate.getHours()).padStart(2, "0")}:${String(snoozeDate.getMinutes()).padStart(2, "0")}`;

      const endpoint = activity.type === "meeting"
        ? `/api/meetings/${activity.id}/reschedule`
        : `/api/follow-ups/${activity.id}/reschedule`;

      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate, newTime, reason: `Snoozed ${minutes} minutes` }),
      });
      await refreshData();
    } catch (e) {
      console.error("Failed to snooze activity", e);
    }
  }, [silenceAlarm, dismissTimer, refreshData]);

  // Listen for Service Worker background action messages (Complete/Snooze from lockscreen)
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "ACTIVITY_COMPLETED" && event.data?.activityId) {
        silenceAlarm();
        setCompletedIds((prev) => {
          const next = new Set([...prev, event.data.activityId]);
          try {
            localStorage.setItem(COMPLETED_BLACKLIST_KEY, JSON.stringify(Array.from(next)));
          } catch (_) {}
          return next;
        });
        refreshData();
      } else if (event.data?.type === "ACTIVITY_RESCHEDULED") {
        silenceAlarm();
        refreshData();
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [silenceAlarm, refreshData]);

  return {
    activeTimer,
    dismissTimer,
    silenceAlarm,
    completeActivity,
    snoozeActivity,
    isAlarmRinging: !!ringingActivityId || getIsAlarmRinging(),
    currentTime,
  };
}