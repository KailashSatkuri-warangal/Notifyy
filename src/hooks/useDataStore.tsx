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
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    todayMeetings: 0,
    todayFollowUps: 0,
    overdueActivities: 0,
    completedToday: 0,
    upcomingActivities: 0,
  });

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

  const refreshData = useCallback(async () => {
    try {
      // 1. Fetch Session & Profile
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user || !meData.workspace) {
        if (!isAuthPage) {
          router.push("/login");
        }
        setIsInitialized(true);
        return;
      }

      setUser(meData.user);
      setWorkspace(meData.workspace);
      if (meData.settings) {
        setSettings(meData.settings);
      }

      // 2. Fetch all real workspace entities in parallel
      const [cRes, mRes, fRes, nRes, notifsRes, dashRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/meetings"),
        fetch("/api/follow-ups"),
        fetch("/api/notes"),
        fetch("/api/notifications"),
        fetch("/api/dashboard"),
      ]);

      const [cData, mData, fData, nData, notifsData, dashData] = await Promise.all([
        cRes.json(),
        mRes.json(),
        fRes.json(),
        nRes.json(),
        notifsRes.json(),
        dashRes.json(),
      ]);

      if (Array.isArray(cData)) setContacts(cData);
      if (Array.isArray(mData)) setMeetings(mData);
      if (Array.isArray(fData)) setFollowUps(fData);
      if (Array.isArray(nData)) setNotes(nData);
      if (Array.isArray(notifsData)) setNotifications(notifsData);
      if (dashData?.stats) setDashboardStats(dashData.stats);
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
