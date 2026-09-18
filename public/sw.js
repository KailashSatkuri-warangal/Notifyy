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
  let data = { title: "Notifyy Alert", body: "You have an upcoming follow-up or meeting." };
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || data.message || "Never miss a follow-up.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    vibrate: [400, 200, 400, 200, 400, 200, 400],
    requireInteraction: true,
    data: {
      url: data.url || "/dashboard",
    },
    actions: [
      { action: "explore", title: "📞 View & Call" },
      { action: "close", title: "🔕 Dismiss" }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title || "Notifyy", options));
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
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

