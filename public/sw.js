const STATIC_CACHE = "static-v1";
const APP_SHELL = [
    "/",
    "/index.html",
    "/capture.html",
    "/offline.html",
    "/css/style.css",
    "/js/app.js",
    "/js/capture.js",
    "/js/idb.js",
    "/manifest.json",
    "/favicon.ico",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
];

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("snapnote-db", 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains("sync-snaps")) {
                db.createObjectStore("sync-snaps", { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(APP_SHELL);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== STATIC_CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    const req = event.request;
    const url = new URL(req.url);

    
    if (url.pathname.startsWith("/api")) {
        return;
    }

    
    if (url.pathname === "/favicon.ico") {
        return;
    }


    
    if (req.headers.get("accept")?.includes("text/html")) {
        event.respondWith(
            fetch(req).catch(() =>
                caches.match(req).then(r => r || caches.match("/offline.html"))
            )
        );
        return;
    }

    
    event.respondWith(
        caches.match(req).then(cached => {
            if (cached) return cached;
            return fetch(req);
        })
    );
});


self.addEventListener("sync", event => {
    if (event.tag === "sync-snaps") {
        event.waitUntil(sendSnaps());
    }
});

async function sendSnaps() {
    const db = await openDB();
    const snaps = await new Promise(resolve => {
        const tx = db.transaction("sync-snaps", "readonly");
        const req = tx.objectStore("sync-snaps").getAll();
        req.onsuccess = () => resolve(req.result);
    });

    for (const snap of snaps) {
        const formData = new FormData();
        formData.append("title", snap.title);

        if (snap.image instanceof Blob) {
            formData.append("image", snap.image, "offline.jpg");
        }

        await fetch("/api/snaps", {
            method: "POST",
            body: formData
        });
    }

    const tx = db.transaction("sync-snaps", "readwrite");
    tx.objectStore("sync-snaps").clear();
}

self.addEventListener("push", event => {
    if (!event.data) return;

    const data = event.data.json();

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png"
        })
    );
});

self.addEventListener("notificationclick", event => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes("/index.html") && "focus" in client) {
                    return client.focus();
                }
            }
            return clients.openWindow("/index.html");
        })
    );
});
