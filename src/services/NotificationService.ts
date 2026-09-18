import { AppNotification, ActivityType } from "@/types";

export class NotificationService {
  async getPermissionStatus(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification.requestPermission();
  }

  async showBrowserNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return false;
    }
    if (Notification.permission !== "granted") {
      return false;
    }

    const defaultOptions: any = {
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      vibrate: [400, 200, 400, 200, 400],
      requireInteraction: true,
      tag: "notifyy-alert",
      ...options,
    };

    try {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        const reg = await navigator.serviceWorker.ready;
        await reg.showNotification(title, defaultOptions);
        return true;
      } else {
        new Notification(title, defaultOptions);
        return true;
      }
    } catch (e) {
      console.warn("Browser notification failed", e);
      return false;
    }
  }

  async createInAppNotification(params: {
    type: AppNotification["type"];
    title: string;
    message: string;
    activityId?: string;
    activityType?: ActivityType;
    contactId?: string;
  }): Promise<AppNotification> {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to create notification");

    // Also trigger browser notification
    await this.showBrowserNotification(params.title, {
      body: params.message,
      tag: params.activityId || params.type,
    });

    return data.data;
  }

  async getNotifications(): Promise<AppNotification[]> {
    const res = await fetch("/api/notifications");
    if (!res.ok) return [];
    return res.json();
  }

  async markAsRead(id: string): Promise<void> {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async markAllAsRead(): Promise<void> {
    await fetch("/api/notifications", { method: "PATCH" });
  }

  async clearAll(): Promise<void> {
    await fetch("/api/notifications", { method: "DELETE" });
  }
}

export const notificationService = new NotificationService();
