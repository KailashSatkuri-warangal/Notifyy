// Notifyy Advanced PWA Service Worker
const CACHE_NAME = "notifyy-v2";
const OFFLINE_FALLBACK_PAGE = "/";
const ASSETS_TO_CACHE = [
  "/",
  "/login",
  "/dashboard",
  "/calendar",
  "/contacts",
  "/meetings",
  "/follow-ups",
  "/notes",
  "/settings",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.ico"
];

// Install: pre-cache shell and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-while-revalidate with offline fallback
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Exclude API mutations & external resources if needed
  if (url.pathname.startsWith("/api/auth")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networked = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200 && response.type === "basic") {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_FALLBACK_PAGE);
          }
        });

      return cached || networked;
    })
  );
});

// Push Notifications
self.addEventListener("push", (event) => {
  let data = { title: "Notifyy Reminder", body: "You have an upcoming follow-up or meeting." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || "Scheduled follow-up reminder.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [400, 200, 400, 200, 400, 200, 400],
    requireInteraction: true,
    tag: data.activityId ? `notifyy-activity-${data.activityId}` : "notifyy-alert",
    data: {
      activityId: data.activityId,
      activityType: data.activityType || "follow_up",
      contactMobile: data.contactMobile || "",
      contactName: data.contactName || "",
      contactId: data.contactId || "",
      url: data.url || "/dashboard",
    },
    actions: [
      { action: "call", title: "📞 Call" },
      { action: "complete", title: "✅ Complete" },
      { action: "snooze", title: "⏱️ Snooze (5m)" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || "⏰ Notifyy Reminder", options));
});

// Notification Click Actions (Call, Complete, Snooze, Open)
self.addEventListener("notificationclick", (event) => {
  const notifData = event.notification.data || {};
  const action = event.action;

  if (action === "call") {
    // 1. Action: Call -> Open phone dialer via tel: and keep reminder active
    if (notifData.contactMobile) {
      event.waitUntil(
        clients.openWindow(`tel:${notifData.contactMobile}`)
      );
    }
    // Do not close notification if user is calling, or keep it visible
    return;
  }

  // Close notification for complete, snooze, or body click
  event.notification.close();

  if (action === "complete" && notifData.activityId) {
    // 2. Action: Complete -> Mark task completed in database & turn off alarm
    const endpoint = notifData.activityType === "meeting"
      ? `/api/meetings/${notifData.activityId}/complete`
      : `/api/follow-ups/${notifData.activityId}/complete`;

    event.waitUntil(
      fetch(endpoint, { method: "POST" })
        .then(() => {
          return clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
              client.postMessage({ type: "ACTIVITY_COMPLETED", activityId: notifData.activityId });
            }
          });
        })
        .catch((err) => console.error("SW complete error:", err))
    );
    return;
  }

  if (action === "snooze" && notifData.activityId) {
    // 3. Action: Snooze -> Reschedule reminder +5 minutes in database
    const snoozeDate = new Date(Date.now() + 5 * 60 * 1000);
    const newDate = snoozeDate.toISOString().split("T")[0];
    const newTime = `${String(snoozeDate.getHours()).padStart(2, "0")}:${String(snoozeDate.getMinutes()).padStart(2, "0")}`;

    const endpoint = notifData.activityType === "meeting"
      ? `/api/meetings/${notifData.activityId}/reschedule`
      : `/api/follow-ups/${notifData.activityId}/reschedule`;

    event.waitUntil(
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newDate, newTime, reason: "Snoozed 5 minutes" }),
      })
        .then(() => {
          return clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
              client.postMessage({ type: "ACTIVITY_RESCHEDULED", activityId: notifData.activityId });
            }
          });
        })
        .catch((err) => console.error("SW snooze error:", err))
    );
    return;
  }

  // 4. Default: Open or focus Notifyy web app window
  const targetUrl = notifData.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Background Sync
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-activities") {
    console.log("[Notifyy SW] Background sync triggered");
  }
});

// Periodic Background Sync
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "check-reminders") {
    console.log("[Notifyy SW] Periodic sync checking reminders");
  }
});

