"use client";

import { useState } from "react";
import { useDataStore } from "@/hooks/useDataStore";
import { backupService } from "@/services/BackupService";
import { forceReloadDemoData } from "@/seed";
import { Button, Input, Modal } from "@/components/ui";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { REMINDER_OPTIONS, APP_METADATA } from "@/lib/constants";
import { ReminderOffset, BackupData } from "@/types";
import {
  Settings,
  User,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Sun,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cloud,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings, refreshData } = useDataStore();

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
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = async () => {
    const jsonStr = await backupService.exportData();
    backupService.downloadBackupFile(jsonStr);
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
      setParsedBackup(null);
      setBackupJson(null);
    } catch (err: any) {
      setRestoreStatus("Restore error: " + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleReloadDemo = async () => {
    if (confirm("Reset local database and reload full realistic demo dataset?")) {
      await forceReloadDemoData();
      await refreshData();
      alert("Demo data reloaded successfully!");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
          Settings & Preferences
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Configure notifications, profile information, themes, and offline data backups
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

        {/* 2. Notification & Daily Summary Settings */}
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
          </div>
        </div>

        {/* 3. Appearance */}
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

      {/* 4. Local Backup & Restore */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Local Data Backup & Restore
          </h3>
        </div>

        <p className="text-xs text-zinc-500">
          Notifyy operates 100% offline-first in your browser using IndexedDB. You can export a snapshot JSON file anytime or restore from a past backup.
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

      {/* 5. Demo Data Management */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Reset & Reload Demo Data</h3>
          <p className="text-xs text-zinc-500">Populate the app with sample business contacts, meetings, notes, and follow-ups</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleReloadDemo} className="text-xs shrink-0">
          <RefreshCw className="w-3.5 h-3.5 mr-1 text-indigo-600" />
          Reload Demo Data
        </Button>
      </div>

      {/* 6. Future Architecture & About */}
      <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-6 space-y-3 text-xs text-zinc-500">
        <h4 className="font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
          {APP_METADATA.name} v{APP_METADATA.version} · Cloud Architecture Roadmap
        </h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            Google Calendar Sync — <span className="text-indigo-500">Coming Soon</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            Google Drive Auto-Backup — <span className="text-indigo-500">Coming Soon</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            WhatsApp Direct Integration — <span className="text-indigo-500">Coming Soon</span>
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
            AI Relationship Summaries — <span className="text-indigo-500">Coming Soon</span>
          </span>
        </div>
      </div>
    </div>
  );
}
