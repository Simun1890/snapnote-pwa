const DB_NAME = "snapnote-db";
const DB_VERSION = 1;
const STORE_NAME = "sync-snaps";

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function addSnap(snap) {
    return openDB().then(db => {
        return new Promise(resolve => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).add(snap);
            tx.oncomplete = resolve;
        });
    });
}

function getAllSnaps() {
    return openDB().then(db => {
        return new Promise(resolve => {
            const tx = db.transaction(STORE_NAME, "readonly");
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result);
        });
    });
}

function clearSnaps() {
    return openDB().then(db => {
        return new Promise(resolve => {
            const tx = db.transaction(STORE_NAME, "readwrite");
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = resolve;
        });
    });
}
