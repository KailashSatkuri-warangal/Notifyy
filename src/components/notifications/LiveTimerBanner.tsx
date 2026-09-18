"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActivityReminders } from "@/hooks/useActivityReminders";
import { useCallAction } from "@/hooks/useCallAction";
import { useDataStore } from "@/hooks/useDataStore";
import { WhatsAppModal } from "@/components/activities/WhatsAppModal";
import {
  Clock,
  Video,
  Phone,
  MessageSquare,
  Calendar as CalendarIcon,
  X,
  BellRing,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { formatActivityTime, setNativeDeviceAlarm } from "@/lib/date-utils";
import Link from "next/link";

export function LiveTimerBanner() {
  const { activeTimer, dismissTimer } = useActivityReminders();
  const { contacts } = useDataStore();
  const { initiateCall } = useCallAction();
  const [whatsAppActivity, setWhatsAppActivity] = useState<any | null>(null);

  if (!activeTimer) return null;

  const { activity, formattedCountdown, isOverdue, isDueNow } = activeTimer;
  const contact = contacts.find((c) => c.id === activity.contactId);

  const handleCall = () => {
    if (contact) {
      initiateCall(contact);
    } else if (activity.contactMobile) {
      initiateCall({
        id: activity.contactId,
        name: activity.contactName,
        company: activity.contactCompany,
        mobile: activity.contactMobile,
        isArchived: false,
        createdAt: "",
        updatedAt: "",
      });
    }
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: -20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          className="w-full mb-4"
        >
          <div
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border shadow-lg backdrop-blur-xl p-3.5 sm:p-4 transition-all ${
              isOverdue
                ? "bg-rose-50/90 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/80 shadow-rose-500/10"
                : isDueNow
                ? "bg-amber-50/90 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/80 shadow-amber-500/10"
                : "bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-900/80 shadow-indigo-500/10"
            }`}
          >
            {/* Top Indicator & Content Row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                {/* Status Icon */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    isOverdue
                      ? "bg-rose-600 text-white"
                      : isDueNow
                      ? "bg-amber-600 text-white animate-bounce"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isDueNow ? (
                    <BellRing className="w-5 h-5" />
                  ) : activity.type === "meeting" ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                {/* Title & Contact Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isOverdue
                          ? "bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                          : isDueNow
                          ? "bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                          : "bg-indigo-200 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200"
                      }`}
                    >
                      {isOverdue ? "Overdue" : isDueNow ? "Due Now" : `Starts in ${formattedCountdown}`}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      {formatActivityTime(activity.time)}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-black text-zinc-900 dark:text-zinc-100 truncate mt-0.5">
                    {activity.title}
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium truncate">
                    with <span className="font-bold">{activity.contactName}</span> {activity.contactCompany && `(${activity.contactCompany})`}
                  </p>
                </div>
              </div>

              {/* Right: Live Ticking Countdown Pill or Status Badge & Dismiss */}
              <div className="flex items-center gap-2 shrink-0">
                {isOverdue ? (
                  <div className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wider flex items-center gap-1.5 shadow-xs bg-rose-600 text-white">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdue</span>
                  </div>
                ) : isDueNow || activeTimer.isRinging ? (
                  <div className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wider flex items-center gap-1.5 shadow-xs bg-amber-500 text-white animate-pulse">
                    <BellRing className="w-3.5 h-3.5 animate-bounce" />
                    <span>Due Now</span>
                  </div>
                ) : (
                  <div className="px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-black tracking-wider flex items-center gap-1.5 shadow-xs bg-indigo-600 text-white">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formattedCountdown}</span>
                  </div>
                )}

                {/* Dismiss / Silence Button */}
                <button
                  onClick={() => dismissTimer(activity.id)}
                  title="Dismiss alert"
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom 1-Tap Action Buttons (Direct Call, WhatsApp, Stop Alarm, Calendar) */}
            <div className="mt-3 pt-2.5 border-t border-zinc-200/60 dark:border-zinc-800/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* 1-Tap Call */}
                <button
                  onClick={handleCall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  <span>Call Now</span>
                </button>

                {/* 1-Tap WhatsApp */}
                <button
                  onClick={() => setWhatsAppActivity(activity)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">WhatsApp</span>
                </button>

                {/* 1-Tap Phone Clock Alarm Trigger */}
                <button
                  onClick={() => setNativeDeviceAlarm({ timeStr: activity.time, title: `${activity.title} (${activity.contactName})`, dateStr: activity.date })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                  title="Set phone hardware alarm"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Set Phone Alarm</span>
                </button>

                {/* Stop Alarm Ringing Button if active */}
                {activeTimer.isRinging && (
                  <button
                    onClick={() => dismissTimer(activity.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-xs active:scale-95 transition-all animate-pulse cursor-pointer"
                  >
                    <BellRing className="w-3.5 h-3.5 animate-spin" />
                    <span>Stop Alarm</span>
                  </button>
                )}
              </div>

              {/* View in Calendar */}
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Open Calendar →</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* WhatsApp Modal */}
      {whatsAppActivity && (
        <WhatsAppModal
          isOpen={true}
          onClose={() => setWhatsAppActivity(null)}
          contact={
            contacts.find((c) => c.id === whatsAppActivity.contactId) || {
              id: whatsAppActivity.contactId,
              name: whatsAppActivity.contactName,
              company: whatsAppActivity.contactCompany,
              mobile: whatsAppActivity.contactMobile,
              isArchived: false,
              createdAt: "",
              updatedAt: "",
            }
          }
          activity={whatsAppActivity}
        />
      )}
    </>
  );
}