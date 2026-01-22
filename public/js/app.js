function loadSnaps() {
    fetch("/api/snaps")
        .then(res => res.json())
        .then(snaps => {
            const list = document.getElementById("snap-list");
            list.innerHTML = "";

            snaps.forEach(snap => {
                const li = document.createElement("li");
                li.innerHTML = `
          <strong>${snap.title}</strong><br>
          ${snap.image ? `<img src="${snap.image}" width="200">` : ""}
          <small>${new Date(snap.createdAt).toLocaleString()}</small>
        `;
                list.appendChild(li);
            });
        })
        .catch(() => {
            
        });
}

loadSnaps();

window.addEventListener("online", () => {
    loadSnaps();
});

const pushBtn = document.getElementById("enable-push");


if (pushBtn && "serviceWorker" in navigator && "PushManager" in window) {
    pushBtn.addEventListener("click", () => {
        Notification.requestPermission().then(permission => {
            if (permission !== "granted") return;

            navigator.serviceWorker.ready.then(sw => {
                return sw.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(
                        "BNYSy4HYMVjSny_qcuNiUYWOyqcwAZ68eT-cc3r-4GXiudNYgFW06zIp_TSURMGkPhw58eebnTjVyQ7nepSNVAU"
                    )
                });
            }).then(subscription => {
                return fetch("/save-subscription", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(subscription)
                });
            }).then(() => {
                alert("Push notifikacije omogućene!");
            });
        });
    });
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(char => char.charCodeAt(0)));
}