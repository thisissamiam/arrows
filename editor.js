window.addEventListener("DOMContentLoaded", () => {

  const editorEl = document.getElementById("editor");
  const lineNumbers = document.getElementById("lineNumbers");

  window.editor = editorEl;

  // 🔥 LOAD SAVED CODE
  editorEl.value = localStorage.getItem("arrow_code") || ">>>[>.]";

  function updateLines(){
    const lines = editorEl.value.split("\n").length;

    let html = "";
    for(let i = 1; i <= Math.min(lines, 50000); i++){
      html += `<div>${i}</div>`;
    }

    lineNumbers.innerHTML = html;
  }

  editorEl.addEventListener("keydown", (e) => {

    if(e.key === "Tab"){
      e.preventDefault();

      const start = editorEl.selectionStart;
      editorEl.value =
        editorEl.value.substring(0, start) +
        "  " +
        editorEl.value.substring(editorEl.selectionEnd);

      editorEl.selectionStart = editorEl.selectionEnd = start + 2;
    }

    if(e.key === "Enter" && e.ctrlKey){
      e.preventDefault();
      if (window.runCode) window.runCode();
    }
  });

  editorEl.addEventListener("scroll", () => {
    lineNumbers.scrollTop = editorEl.scrollTop;
  });

  editorEl.addEventListener("input", () => {
    updateLines();

    // 💾 AUTO SAVE
    localStorage.setItem("arrow_code", editorEl.value);
  });

  updateLines();

});

// 🔥 SERVICE WORKER REGISTER
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/arrows/service-worker.js")
      .then(() => console.log("Service Worker registered"))
      .catch(err => console.log("SW failed:", err));
  });
}

// 🚀 AUTO UPDATE + FORCE RELOAD SYSTEM
let lastVersion = null;
let checkingUpdate = false;

async function checkForUpdate() {
  if (!navigator.onLine || checkingUpdate) return;
  checkingUpdate = true;

  try {
    const res = await fetch("/arrows/index.html", { cache: "no-store" });
    const text = await res.text();

    if (lastVersion && lastVersion !== text) {
      console.log("🔄 Update detected → reloading...");
      location.reload();
      return;
    }

    lastVersion = text;
  } catch (e) {
    // ignore errors
  }

  checkingUpdate = false;
}

// check every 30 seconds
setInterval(checkForUpdate, 30000);

// ⚡ instant check when internet comes back
window.addEventListener("online", () => {
  checkForUpdate();
});
