const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const webpush = require("web-push");

const app = express();
const PORT = process.env.PORT || 3000;

const VAPID_PUBLIC_KEY =
    "BNYSy4HYMVjSny_qcuNiUYWOyqcwAZ68eT-cc3r-4GXiudNYgFW06zIp_TSURMGkPhw58eebnTjVyQ7nepSNVAU";

const VAPID_PRIVATE_KEY =
    "zRlnn6Mc8iJyMgT7WqZgQ-RYC5xH_M6gRvY6IFAM9P8";


webpush.setVapidDetails(
    "mailto:test@example.com",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);


app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, "public/uploads");
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + "-" + file.originalname);
        }
    })
});


const DATA_FILE = path.join(__dirname, "data", "snaps.json");

function readSnaps() {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveSnaps(snaps) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(snaps, null, 2));
}


app.get("/api/snaps", (req, res) => {
    const snaps = readSnaps();
    res.json(snaps);
});


app.post("/api/snaps", upload.single("image"), (req, res) => {
    const snaps = readSnaps();

    const newSnap = {
        id: Date.now(),
        title: req.body.title || "Bez naslova",
        image: req.file ? `/uploads/${req.file.filename}` : null,
        createdAt: new Date().toISOString()
    };

    snaps.push(newSnap);
    saveSnaps(snaps);

    res.status(201).json(newSnap);
    sendPushNotification();
});

let subscriptions = [];

app.post("/save-subscription", (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    res.status(201).json({ message: "Subscription saved" });
});

function sendPushNotification() {
    const payload = JSON.stringify({
        title: "Snap sinkroniziran 📸",
        body: "Vaša offline bilješka je uspješno sinkronizirana."
    });

    subscriptions.forEach(sub => {
        webpush.sendNotification(sub, payload).catch(() => { });
    });
}


app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

