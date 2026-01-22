const form = document.getElementById("snap-form");
const titleInput = document.getElementById("title");

const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const snapBtn = document.getElementById("snap-btn");

const fallback = document.getElementById("fallback");
const imageUpload = document.getElementById("image-upload");

let imageBlob = null;

if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
        })
        .catch(() => {
            enableFallback();
        });
} else {
    enableFallback();
}

function enableFallback() {
    document.getElementById("camera-container").hidden = true;
    fallback.hidden = false;
}

snapBtn.addEventListener("click", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.hidden = false;

    canvas.toBlob(blob => {
        imageBlob = blob;
    }, "image/jpeg");
});

form.addEventListener("submit", event => {
    event.preventDefault();

    const title = titleInput.value;
    const snapData = {
        title,
        image: imageBlob || (imageUpload.files[0] || null),
        createdAt: new Date().toISOString()
    };

    const formData = new FormData();
    formData.append("title", title);

    if (imageBlob) {
        formData.append("image", imageBlob, "snapshot.jpg");
    } else if (imageUpload.files.length > 0) {
        formData.append("image", imageUpload.files[0]);
    }

    fetch("/api/snaps", {
        method: "POST",
        body: formData
    })
        .then(() => {
            window.location.href = "/index.html";
        })
        .catch(() => {
            addSnap(snapData)
                .then(() => navigator.serviceWorker.ready)
                .then(sw => sw.sync.register("sync-snaps"))
                .then(() => {
                    alert("Snap spremljen offline i bit će sinkroniziran kasnije.");
                    window.location.href = "/index.html";
                });
        });
});
