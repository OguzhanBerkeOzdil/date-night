/** In-theme toasts, confirm dialog, and save warnings (non-achievement). */

let saveWarned = false;
let undoTimer = null;

function $(id) {
  return document.getElementById(id);
}

export function showSaveWarningToast() {
  if (saveWarned) return;
  saveWarned = true;
  showAppToast("Your progress can't be saved on this device — keep this tab open", { duration: 6000 });
}

export function resetSaveWarningFlag() {
  saveWarned = false;
}

export function showAppToast(message, { duration = 4000, actionLabel, onAction } = {}) {
  const wrap = $("appToasts") || $("achievementToasts");
  if (!wrap) return;
  const el = document.createElement("div");
  el.className = "app-toast";
  el.setAttribute("role", "status");
  const label = document.createElement("span");
  label.className = "app-toast__text";
  label.textContent = message;
  el.appendChild(label);
  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "app-toast__action";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      onAction();
      el.remove();
    });
    el.appendChild(btn);
  }
  wrap.appendChild(el);
  window.setTimeout(() => {
    el.classList.add("app-toast--out");
    window.setTimeout(() => el.remove(), 320);
  }, duration);
}

export function showUndoToast(message, onUndo, durationMs = 6000) {
  if (undoTimer) clearTimeout(undoTimer);
  showAppToast(message, {
    duration: durationMs,
    actionLabel: "Undo",
    onAction: () => {
      if (undoTimer) clearTimeout(undoTimer);
      undoTimer = null;
      onUndo();
    },
  });
  undoTimer = window.setTimeout(() => {
    undoTimer = null;
  }, durationMs);
}

export function showNewQuestConfirm({ onKeep, onStartOver }) {
  const root = $("questConfirm");
  if (!root) {
    onStartOver();
    return;
  }
  const keep = $("questConfirmKeep");
  const start = $("questConfirmStart");
  const close = () => {
    root.classList.add("hidden");
    root.setAttribute("hidden", "");
  };
  root.classList.remove("hidden");
  root.removeAttribute("hidden");
  const prevFocus = document.activeElement;
  start?.focus();
  const trap = (e) => {
    if (e.key !== "Tab" || !root.contains(document.activeElement)) return;
    const focusable = root.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const list = [...focusable].filter((n) => !n.disabled);
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  const cleanup = () => {
    document.removeEventListener("keydown", onKey);
    close();
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  };
  const onKey = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cleanup();
      onKeep();
    }
    trap(e);
  };
  document.addEventListener("keydown", onKey);
  keep?.addEventListener("click", () => {
    cleanup();
    onKeep();
  }, { once: true });
  start?.addEventListener("click", () => {
    cleanup();
    onStartOver();
  }, { once: true });
}
