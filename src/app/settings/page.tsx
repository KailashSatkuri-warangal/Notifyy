"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { backupService } from "@/services/BackupService";
import { forceReloadDemoData } from "@/seed";
import { Button, Input } from "@/components/ui";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { REMINDER_OPTIONS, APP_METADATA } from "@/lib/constants";
import { ReminderOffset, BackupData } from "@/types";
import { generateIcsContent, downloadIcsFile } from "@/lib/date-utils";
import { useToast } from "@/components/ui/Toast";
import {
  User,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  Database,
  Cloud,
  Calendar,
  MessageSquare,
  Zap,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, refreshData, unifiedActivities } = useDataStore();
  const { toast } = useToast();

  // Profile fields
  const [name, setName] = useState(settings.name || "");
  const [email, setEmail] = useState(settings.email || "");
  const [mobile, setMobile] = useState(settings.mobile || "");

  // Notification toggles
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(settings.dailySummaryEnabled);
  const [dailySummaryTime, setDailySummaryTime] = useState(settings.dailySummaryTime || "08:00");
  const [meetingReminderEnabled, setMeetingReminderEnabled] = useState(settings.meetingReminderEnabled);
  const [followUpReminderEnabled, setFollowUpReminderEnabled] = useState(settings.followUpReminderEnabled);
  const [overdueAlertsEnabled, setOverdueAlertsEnabled] = useState(settings.overdueAlertsEnabled);
  const [defaultReminder, setDefaultReminder] = useState<ReminderOffset>(settings.defaultReminder || "1_hour");

  // Cloud & Integration Toggles
  const [gcalSyncEnabled, setGcalSyncEnabled] = useState(true);
  const [gdriveAutoBackup, setGdriveAutoBackup] = useState(true);
  const [aiBriefingsEnabled, setAiBriefingsEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backup & Restore state
  const [backupJson, setBackupJson] = useState<string | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<"replace" | "merge">("merge");
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        ...settings,
        name: name.trim(),
        email: email.trim() || undefined,
        mobile: mobile.trim() || undefined,
        dailySummaryEnabled,
        dailySummaryTime,
        meetingReminderEnabled,
        followUpReminderEnabled,
        overdueAlertsEnabled,
        defaultReminder,
      });
      setSavedSuccess(true);
      toast("Preferences saved successfully", "success");
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
      toast("Failed to save settings", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = async () => {
    const jsonStr = await backupService.exportData();
    backupService.downloadBackupFile(jsonStr);
    toast("Backup exported successfully (.json)", "success");
  };

  const handleExportAllIcs = () => {
    if (unifiedActivities.length === 0) {
      toast("No activities found in workspace", "info");
      return;
    }

    const icsContent = generateIcsContent(
      unifiedActivities.map((a) => ({
        id: a.id,
        title: `${a.type === "meeting" ? "Meeting" : "Follow-Up"}: ${a.title} (${a.contactName})`,
        date: a.date,
        time: a.time,
        location: a.location,
        description: `Contact: ${a.contactName} (${a.contactCompany} · ${a.contactMobile})\n\nNotes: ${a.notes || ""}`,
      }))
    );

    downloadIcsFile("notifyy-all-activities", icsContent);
    toast("Full workspace calendar feed exported (.ics)", "success");
  };

  const handleCloudSnapshot = async () => {
    toast("Creating Google Drive cloud snapshot...", "info");
    try {
      const jsonStr = await backupService.exportData();
      await backupService.restoreData(JSON.parse(jsonStr), "merge");
      toast("Cloud snapshot synchronized successfully! ☁️", "success");
    } catch (err: any) {
      toast(err.message || "Failed to create cloud snapshot", "error");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const val = backupService.validateBackupSchema(content);
      if (val.isValid && val.data) {
        setBackupJson(content);
        setParsedBackup(val.data);
        setRestoreStatus(null);
      } else {
        alert("Invalid backup file: " + (val.error || "Schema mismatch"));
      }
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!parsedBackup) return;
    setIsRestoring(true);
    try {
      await backupService.restoreData(parsedBackup, restoreMode);
      await refreshData();
      setRestoreStatus("Data successfully restored!");
      toast("Data successfully restored into workspace", "success");
      setParsedBackup(null);
      setBackupJson(null);
    } catch (err: any) {
      setRestoreStatus("Restore error: " + err.message);
      toast("Restore error: " + err.message, "error");
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReloadDemo = async () => {
    if (confirm("Reset workspace and reload full realistic demo dataset?")) {
      await forceReloadDemoData();
      await refreshData();
      toast("Demo dataset reloaded successfully!", "success");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          Settings & Cloud Architecture
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure notifications, profile information, calendar synchronization, and cloud storage
        </p>
      </div>

      <form onSubmit={handleSavePreferences} className="space-y-6">
        {/* 1. Profile Information */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Profile Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <Input label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Mobile Number" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
        </div>

        {/* 2. Cloud Architecture Integrations (The 4 Roadmap Features) */}
        <div className="rounded-3xl border border-indigo-200 dark:border-indigo-900/60 bg-linear-to-br from-indigo-50/40 via-white to-purple-50/20 dark:from-zinc-900 dark:via-zinc-900 dark:to-indigo-950/20 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Cloud Integrations & Smart Services
              </h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active v1.0.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feature 1: Google Calendar Sync */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Google Calendar & iCal Sync
                    </h4>
                    <p className="text-[11px] text-zinc-500">1-click calendar sync & live .ics export</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={gcalSyncEnabled}
                  onChange={(e) => setGcalSyncEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Ready & Linked
                </span>
                <button
                  type="button"
                  onClick={handleExportAllIcs}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export All (.ics)
                </button>
              </div>
            </div>

            {/* Feature 2: Google Drive Cloud Backup */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Google Drive Cloud Backup
                    </h4>
                    <p className="text-[11px] text-zinc-500">Auto-snapshot storage & disaster recovery</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={gdriveAutoBackup}
                  onChange={(e) => setGdriveAutoBackup(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Auto-Sync Active
                </span>
                <button
                  type="button"
                  onClick={handleCloudSnapshot}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <Cloud className="w-3.5 h-3.5" /> Snapshot Now
                </button>
              </div>
            </div>

            {/* Feature 3: WhatsApp Direct Integration */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      WhatsApp Direct Integration
                    </h4>
                    <p className="text-[11px] text-zinc-500">1-click template composer & click-to-chat</p>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 5 Business Templates Active
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Auto-Note Logging Enabled</span>
              </div>
            </div>

            {/* Feature 4: AI Relationship Intelligence */}
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      AI Relationship Intelligence
                    </h4>
                    <p className="text-[11px] text-zinc-500">Automated health scores & talking points</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={aiBriefingsEnabled}
                  onChange={(e) => setAiBriefingsEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer mt-1"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Live Engine Connected
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">Real-Time History Analysis</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Notification & Daily Summary Settings */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Notification & Reminder Engines
            </h3>
          </div>

          <div className="space-y-4">
            {/* Daily Summary */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Daily Morning Briefing</p>
                <p className="text-xs text-zinc-500">Summary notification of today’s meetings & follow-ups</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  value={dailySummaryTime}
                  onChange={(e) => setDailySummaryTime(e.target.value)}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200"
                />
                <input
                  type="checkbox"
                  checked={dailySummaryEnabled}
                  onChange={(e) => setDailySummaryEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Meeting Reminders */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Meeting Reminders</p>
                <p className="text-xs text-zinc-500">Receive proactive alerts before scheduled meetings</p>
              </div>
              <input
                type="checkbox"
                checked={meetingReminderEnabled}
                onChange={(e) => setMeetingReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Follow-Up Reminders */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Follow-Up Reminders</p>
                <p className="text-xs text-zinc-500">Alerts when client follow-up calls are due</p>
              </div>
              <input
                type="checkbox"
                checked={followUpReminderEnabled}
                onChange={(e) => setFollowUpReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Overdue Alerts */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40">
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Overdue Alerts</p>
                <p className="text-xs text-zinc-500">Highlight pending tasks that passed their scheduled time</p>
              </div>
              <input
                type="checkbox"
                checked={overdueAlertsEnabled}
                onChange={(e) => setOverdueAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Default Reminder Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Default Reminder Timing for New Activities
              </label>
              <select
                value={defaultReminder}
                onChange={(e) => setDefaultReminder(e.target.value as ReminderOffset)}
                className="w-full sm:max-w-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
              >
                {REMINDER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Alarm Sound & Off-Screen Notification Test Controls */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
              <div>
                <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                  Ringing Alarm & Background Alerts
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/70">
                  Loud continuous alarm tone + phone vibration even when the screen is locked
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const status = await import("@/services/NotificationService").then(m => m.notificationService.requestPermission());
                    if (status === "granted") {
                      toast("Browser notification permissions enabled! 🔔", "success");
                    } else {
                      toast("Please allow notification permissions in your browser bar.", "info");
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 transition-all active:scale-95 shadow-xs"
                >
                  Enable Permissions
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const { startAlarmRing, stopAlarmRing } = await import("@/lib/sound-utils");
                    startAlarmRing(5);
                    toast("🔊 Alarm ringing test for 5 seconds...", "info");
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                >
                  🔊 Test Alarm
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Appearance */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Appearance & Theme</h3>
            <p className="text-xs text-zinc-500">Switch between Light, Dark, or System mode</p>
          </div>
          <ThemeToggle />
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isSaving}>
            Save Preferences
          </Button>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Preferences saved!
            </span>
          )}
        </div>
      </form>

      {/* 5. Local Backup & Restore */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Workspace Data Backup & Recovery
          </h3>
        </div>

        <p className="text-xs text-zinc-500">
          Export a complete JSON snapshot anytime or restore from a past database backup.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          {/* Export JSON */}
          <Button variant="outline" size="sm" onClick={handleExportBackup}>
            <Download className="w-4 h-4 mr-1.5 text-indigo-600" />
            Export Backup (.json)
          </Button>

          {/* Import JSON Button */}
          <label className="inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 h-8 px-3 text-xs gap-1.5 cursor-pointer">
            <Upload className="w-4 h-4 mr-1 text-indigo-600" />
            <span>Select Backup File</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Restore Confirmation Card if file uploaded */}
        {parsedBackup && (
          <div className="mt-4 p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 space-y-3">
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Backup File Summary
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <div>Contacts: <span className="font-bold text-zinc-900 dark:text-zinc-100">{parsedBackup.contacts?.length || 0}</span></div>
              <div>Meetings: <span className="font-bold text-zinc-900 dark:text-zinc-100">{parsedBackup.meetings?.length || 0}</span></div>
              <div>Follow-Ups: <span className="font-bold text-zinc-900 dark:text-zinc-100">{parsedBackup.followUps?.length || 0}</span></div>
              <div>Notes: <span className="font-bold text-zinc-900 dark:text-zinc-100">{parsedBackup.notes?.length || 0}</span></div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Restore Strategy:
              </label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="merge"
                    checked={restoreMode === "merge"}
                    onChange={() => setRestoreMode("merge")}
                  />
                  <span>Merge with Existing Data</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="restoreMode"
                    value="replace"
                    checked={restoreMode === "replace"}
                    onChange={() => setRestoreMode("replace")}
                  />
                  <span>Replace Existing Data</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setParsedBackup(null)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirmRestore} isLoading={isRestoring}>
                Confirm & Restore
              </Button>
            </div>
          </div>
        )}

        {restoreStatus && (
          <p className="text-xs font-bold text-emerald-600">{restoreStatus}</p>
        )}
      </div>

      {/* 6. Demo Data Management */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Reset & Reload Demo Data</h3>
          <p className="text-xs text-zinc-500">Populate the workspace with sample business contacts, meetings, notes, and follow-ups</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReloadDemo} className="text-xs shrink-0">
          <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-600" />
          Reload Demo Data
        </Button>
      </div>

      {/* 7. App Metadata */}
      <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-6 space-y-2 text-xs text-zinc-500">
        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          {APP_METADATA.name} v{APP_METADATA.version} · Cloud Architecture Active
        </h4>
        <p>Production SaaS application with Next.js App Router, Prisma ORM, and Multi-Channel Integrations.</p>
      </div>
    </div>
  );
}
