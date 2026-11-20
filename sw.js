// My Equine Clinic – service worker
// Network first: when online you always get the newest pages from GitHub;
// the saved copy is used only when there is no connection.
const CACHE = "vetdesk-v41";
const CORE = ["./", "index.html", "horse-file.html", "manifest.json", "firebase-config.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return; // Firebase, fonts, Excel tools: not touched
  e.respondWith(
    fetch(req, {cache: "no-store"}).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match("index.html")))
  );
});

// tap on a notification (e.g. feed & hay store low) → open or focus the site
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./#feeding";
  e.waitUntil(clients.matchAll({type: "window", includeUncontrolled: true}).then(list => {
    for (const c of list) { if ("focus" in c) { c.navigate && c.navigate(url).catch(() => {}); return c.focus(); } }
    return clients.openWindow ? clients.openWindow(url) : null;
  }));
});
