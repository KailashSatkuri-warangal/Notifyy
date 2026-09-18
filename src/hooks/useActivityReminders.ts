"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useDataStore } from "./useDataStore";
import { UnifiedActivity } from "@/types";
import { playNotificationSound, triggerDeviceVibration } from "@/lib/sound-utils";
import { notificationService } from "@/services/NotificationService";
import { isToday, isPast } from "date-fns";

export interface ActiveTimerInfo {
  activity: UnifiedActivity;
  minutesRemaining: number;
  secondsRemaining: number;
  totalSecondsRemaining: number;
  formattedCountdown: string;
  isOverdue: boolean;
  isDueNow: boolean;
}

export function useActivityReminders() {
  const { unifiedActivities, refreshData, contacts } = useDataStore();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  const [dismissedActivityIds, setDismissedActivityIds] = useState<Set<string>>(new Set());

  // Update clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter pending activities for today and upcoming
  const pendingActivities = useMemo(() => {
    return unifiedActivities
      .filter((a) => a.status === "pending" || a.status === "overdue")
      .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
  }, [unifiedActivities]);

  // Find the most urgent activity (due soonest, either coming up in next 60 mins or overdue today)
  const activeTimer = useMemo<ActiveTimerInfo | null>(() => {
    const nowMs = currentTime.getTime();

    for (const act of pendingActivities) {
      if (dismissedActivityIds.has(act.id)) continue;

      const actMs = act.dateTime.getTime();
      const diffMs = actMs - nowMs;
      const totalSec = Math.floor(diffMs / 1000);

      // We show the live timer banner if:
      // 1. Upcoming in the next 45 minutes
      // 2. OR overdue today by up to 2 hours
      const isOverdue = totalSec < 0;
      const overdueHours = Math.abs(totalSec) / 3600;

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
        };
      } else if (isOverdue && isToday(act.dateTime) && overdueHours <= 3) {
        const absSec = Math.abs(totalSec);
        const mins = Math.floor(absSec / 60);
        const secs = absSec % 60;
        const formatted = `-${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

        return {
          activity: act,
          minutesRemaining: mins,
          secondsRemaining: secs,
          totalSecondsRemaining: totalSec,
          formattedCountdown: formatted,
          isOverdue: true,
          isDueNow: false,
        };
      }
    }

    return null;
  }, [pendingActivities, currentTime, dismissedActivityIds]);

  // Automated notification and sound trigger
  useEffect(() => {
    const nowMs = currentTime.getTime();

    pendingActivities.forEach((act) => {
      const actMs = act.dateTime.getTime();
      const diffMs = actMs - nowMs;
      const diffMins = Math.floor(diffMs / (1000 * 60));

      // 1. 15-Minute Heads Up Warning
      const key15m = `${act.id}-15m`;
      if (diffMins <= 15 && diffMins > 1 && !notifiedIdsRef.current.has(key15m)) {
        notifiedIdsRef.current.add(key15m);

        playNotificationSound("chime");
        triggerDeviceVibration([150, 80, 150]);

        notificationService.showBrowserNotification(
          `Upcoming: ${act.title}`,
          {
            body: `Starts in ${diffMins} minutes with ${act.contactName} (${act.contactCompany})`,
            tag: key15m,
          }
        );

        notificationService.createInAppNotification({
          type: act.type === "meeting" ? "meeting_reminder" : "followup_reminder",
          title: `Upcoming ${act.type === "meeting" ? "Meeting" : "Follow-Up"} in ${diffMins}m`,
          message: `${act.title} with ${act.contactName} (${act.contactCompany}) is scheduled for ${act.time}.`,
          activityId: act.id,
          activityType: act.type,
          contactId: act.contactId,
        }).then(() => refreshData()).catch(() => {});
      }

      // 2. Exact Time / Due Now Warning (0 - 1 minute)
      const keyNow = `${act.id}-now`;
      if (diffMins <= 0 && diffMins >= -2 && !notifiedIdsRef.current.has(keyNow)) {
        notifiedIdsRef.current.add(keyNow);

        playNotificationSound("alert");
        triggerDeviceVibration([200, 100, 200, 100, 200]);

        notificationService.showBrowserNotification(
          `⏰ Time for ${act.title}!`,
          {
            body: `${act.type === "meeting" ? "Meeting is starting now" : "Follow-up call is due now"} with ${act.contactName}`,
            tag: keyNow,
          }
        );

        notificationService.createInAppNotification({
          type: act.type === "meeting" ? "meeting_reminder" : "followup_reminder",
          title: `⏰ Due Now: ${act.title}`,
          message: `${act.type === "meeting" ? "Meeting" : "Follow-up call"} with ${act.contactName} (${act.contactMobile || act.contactCompany}) is starting now.`,
          activityId: act.id,
          activityType: act.type,
          contactId: act.contactId,
        }).then(() => refreshData()).catch(() => {});
      }
    });
  }, [pendingActivities, currentTime, refreshData]);

  const dismissTimer = (activityId: string) => {
    setDismissedActivityIds((prev) => new Set([...prev, activityId]));
  };

  return {
    activeTimer,
    dismissTimer,
    currentTime,
  };
}