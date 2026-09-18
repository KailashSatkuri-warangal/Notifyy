"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Contact,
  Meeting,
  FollowUp,
  Note,
  Reminder,
  ActivityHistory,
  UserSettings,
  AppNotification,
  UnifiedActivity,
} from "@/types";
import { StatusEngine } from "@/services/StatusEngine";
import { parseActivityDateTime } from "@/lib/date-utils";
import { DEFAULT_USER_SETTINGS } from "@/lib/constants";
import { notificationService } from "@/services/NotificationService";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  mobile?: string | null;
}

interface WorkspaceInfo {
  id: string;
  name: string;
}

interface DashboardStats {
  todayMeetings: number;
  todayFollowUps: number;
  overdueActivities: number;
  completedToday: number;
  upcomingActivities: number;
}

interface DataStoreContextType {
  isInitialized: boolean;
  user: UserProfile | null;
  workspace: WorkspaceInfo | null;
  contacts: Contact[];
  meetings: Meeting[];
  followUps: FollowUp[];
  notes: Note[];
  settings: UserSettings;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  unifiedActivities: UnifiedActivity[];
  dashboardStats: DashboardStats;
  refreshData: () => Promise<void>;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  logout: () => Promise<void>;
  
  // Modals
  activeCallContact: Contact | null;
  triggerCallPrompt: (contact: Contact) => void;
  closeCallPrompt: () => void;
  
  quickCreateType: "meeting" | "follow_up" | "contact" | null;
  quickCreateContactId: string | null;
  openQuickCreate: (type: "meeting" | "follow_up" | "contact", contactId?: string) => void;
  closeQuickCreate: () => void;
  
  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  
  completedActivityContext: {
    contactId: string;
    contactName: string;
    contactCompany: string;
    sourceTitle: string;
  } | null;
  openNextFollowUpPrompt: (ctx: {
    contactId: string;
    contactName: string;
    contactCompany: string;
    sourceTitle: string;
  }) => void;
  closeNextFollowUpPrompt: () => void;
}

const DataStoreContext = createContext<DataStoreContextType | null>(null);

const LOCAL_CACHE_KEY = "notifyy_cache_v2";

const defaultStats: DashboardStats = {
  todayMeetings: 0,
  todayFollowUps: 0,
  overdueActivities: 0,
  completedToday: 0,
  upcomingActivities: 0,
};

export function DataStoreProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>(defaultStats);

  // Modal states
  const [activeCallContact, setActiveCallContact] = useState<Contact | null>(null);
  const [quickCreateType, setQuickCreateType] = useState<"meeting" | "follow_up" | "contact" | null>(null);
  const [quickCreateContactId, setQuickCreateContactId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [completedActivityContext, setCompletedActivityContext] = useState<{
    contactId: string;
    contactName: string;
    contactCompany: string;
    sourceTitle: string;
  } | null>(null);

  const isAuthPage = pathname === "/login" || pathname === "/register";

  // 1. Instant Cache Rehydration on mount (0ms perceived load)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = localStorage.getItem(LOCAL_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        if (data.user && data.workspace) {
          setUser(data.user);
          setWorkspace(data.workspace);
          if (data.settings) setSettings(data.settings);
          if (Array.isArray(data.contacts)) setContacts(data.contacts);
          if (Array.isArray(data.meetings)) setMeetings(data.meetings);
          if (Array.isArray(data.followUps)) setFollowUps(data.followUps);
          if (Array.isArray(data.notes)) setNotes(data.notes);
          if (Array.isArray(data.notifications)) setNotifications(data.notifications);
          if (data.dashboardStats) setDashboardStats(data.dashboardStats);
          setIsInitialized(true);
        }
      }
    } catch (e) {
      console.warn("Failed to read local cache:", e);
    }
  }, []);

  // 2. Single consolidated bootstrap request (Stale-While-Revalidate)
  const refreshData = useCallback(async () => {
    try {
      const res = await fetch("/api/bootstrap");
      const data = await res.json();

      if (!data.authenticated || !data.user || !data.workspace) {
        if (!isAuthPage) {
          try {
            localStorage.removeItem(LOCAL_CACHE_KEY);
          } catch (_) {}
          router.push("/login");
        }
        setIsInitialized(true);
        return;
      }

      setUser(data.user);
      setWorkspace(data.workspace);
      if (data.settings) setSettings(data.settings);
      if (Array.isArray(data.contacts)) setContacts(data.contacts);
      if (Array.isArray(data.meetings)) setMeetings(data.meetings);
      if (Array.isArray(data.followUps)) setFollowUps(data.followUps);
      if (Array.isArray(data.notes)) setNotes(data.notes);
      if (Array.isArray(data.notifications)) setNotifications(data.notifications);
      if (data.dashboardStats) setDashboardStats(data.dashboardStats);

      // Save fresh data to local cache for instant next load
      try {
        localStorage.setItem(
          LOCAL_CACHE_KEY,
          JSON.stringify({
            user: data.user,
            workspace: data.workspace,
            settings: data.settings,
            contacts: data.contacts,
            meetings: data.meetings,
            followUps: data.followUps,
            notes: data.notes,
            notifications: data.notifications,
            dashboardStats: data.dashboardStats,
            savedAt: Date.now(),
          })
        );
      } catch (e) {
        console.warn("Failed to write local cache:", e);
      }
    } catch (err) {
      console.error("Failed to fetch live database records", err);
    } finally {
      setIsInitialized(true);
    }
  }, [isAuthPage, router]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newSettings),
    });
    if (res.ok) {
      const data = await res.json();
      setSettings(data.data);
      if (newSettings.name && user) {
        setUser({ ...user, name: newSettings.name });
      }
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem(LOCAL_CACHE_KEY);
    } catch (_) {}
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setWorkspace(null);
    window.location.href = "/login";
  };

  // Build unified activities mapping
  const contactMap = new Map<string, Contact>();
  contacts.forEach((c) => contactMap.set(c.id, c));

  const unifiedActivities: UnifiedActivity[] = [
    ...meetings.map((m) => {
      const c = contactMap.get(m.contactId);
      const dt = parseActivityDateTime(m.date, m.time);
      return {
        id: m.id,
        type: "meeting" as const,
        contactId: m.contactId,
        contactName: c?.name || "Unknown Contact",
        contactCompany: c?.company || "",
        contactMobile: c?.mobile || "",
        title: m.title,
        date: m.date,
        time: m.time,
        dateTime: dt,
        location: m.location || undefined,
        purpose: m.purpose || undefined,
        notes: m.notes || undefined,
        reminder: (m.reminder as any) || "1_hour",
        status: StatusEngine.evaluateStatus(m.date, m.time, m.status as any),
        createdAt: typeof m.createdAt === "string" ? m.createdAt : new Date(m.createdAt).toISOString(),
        updatedAt: typeof m.updatedAt === "string" ? m.updatedAt : new Date(m.updatedAt).toISOString(),
      };
    }),
    ...followUps.map((f) => {
      const c = contactMap.get(f.contactId);
      const dt = parseActivityDateTime(f.date, f.time);
      return {
        id: f.id,
        type: "follow_up" as const,
        contactId: f.contactId,
        contactName: c?.name || "Unknown Contact",
        contactCompany: c?.company || "",
        contactMobile: c?.mobile || "",
        title: f.title,
        date: f.date,
        time: f.time,
        dateTime: dt,
        notes: f.notes || undefined,
        reminder: (f.reminder as any) || "1_hour",
        status: StatusEngine.evaluateStatus(f.date, f.time, f.status as any),
        createdAt: typeof f.createdAt === "string" ? f.createdAt : new Date(f.createdAt).toISOString(),
        updatedAt: typeof f.updatedAt === "string" ? f.updatedAt : new Date(f.updatedAt).toISOString(),
      };
    }),
  ].sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DataStoreContext.Provider
      value={{
        isInitialized,
        user,
        workspace,
        contacts,
        meetings,
        followUps,
        notes,
        settings,
        notifications,
        unreadNotificationCount,
        unifiedActivities,
        dashboardStats,
        refreshData,
        updateSettings,
        logout,
        activeCallContact,
        triggerCallPrompt: (c) => setActiveCallContact(c),
        closeCallPrompt: () => setActiveCallContact(null),
        quickCreateType,
        quickCreateContactId,
        openQuickCreate: (type, cid) => {
          setQuickCreateType(type);
          setQuickCreateContactId(cid || null);
        },
        closeQuickCreate: () => {
          setQuickCreateType(null);
          setQuickCreateContactId(null);
        },
        isSearchOpen,
        openSearch: () => setIsSearchOpen(true),
        closeSearch: () => setIsSearchOpen(false),
        completedActivityContext,
        openNextFollowUpPrompt: (ctx) => setCompletedActivityContext(ctx),
        closeNextFollowUpPrompt: () => setCompletedActivityContext(null),
      }}
    >
      {children}
    </DataStoreContext.Provider>
  );
}

export function useDataStore() {
  const context = useContext(DataStoreContext);
  if (!context) {
    throw new Error("useDataStore must be used within a DataStoreProvider");
  }
  return context;
}
