/**
 * Content script for Browser Flow
 * Handles injecting modal dialogs for adding selected text to context
 * and syncing guest ID between dashboard (sessionStorage) and extension (chrome.storage.local)
 */
console.log("[Browser Flow] content script loaded on", window.location.href);

// Allowed origins for guest ID sync (dashboard)
const DASHBOARD_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isDashboardOrigin(origin) {
  return origin && DASHBOARD_ORIGIN_PATTERN.test(origin);
}

// Listen for messages from the page (dashboard) to get/set guest ID
window.addEventListener("message", (event) => {
  if (!isDashboardOrigin(event.origin)) return;
  const { type, guestId } = event.data || {};
  if (type === "BROWSER_FLOW_GET_GUEST_ID") {
    chrome.runtime.sendMessage({ type: "GET_GUEST_ID" }, (response) => {
      const id = response?.guestId || null;
      event.source?.postMessage(
        { type: "BROWSER_FLOW_GUEST_ID_RESPONSE", guestId: id },
        event.origin
      );
    });
  } else if (type === "BROWSER_FLOW_SYNC_GUEST_ID" && typeof guestId === "string" && guestId.trim()) {
    chrome.runtime.sendMessage({ type: "SET_GUEST_ID", guestId: guestId.trim() }, (response) => {
      event.source?.postMessage(
        { type: "BROWSER_FLOW_SYNC_GUEST_ID_RESPONSE", ok: !!response?.ok },
        event.origin
      );
    });
  }
});

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_CONTEXT_DIALOG") {
    showContextDialog(message.data);
    sendResponse({ ok: true });
  }
  return true;
});

function showContextDialog(data) {
  const { selectedText, tabTitle } = data;

  // Remove existing dialog if present
  const existingDialog = document.getElementById("browser-flow-dialog");
  if (existingDialog) {
    existingDialog.remove();
  }

  // Create modal overlay
  const overlay = document.createElement("div");
  overlay.id = "browser-flow-dialog";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
  `;

  // Create dialog card
  const dialog = document.createElement("div");
  dialog.style.cssText = `
    background: rgba(255, 255, 255, 0.98);
    border-radius: 18px;
    padding: 24px;
    width: 90%;
    max-width: 440px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(148, 163, 184, 0.2);
    backdrop-filter: blur(20px);
    color: #1e293b;
  `;

  // Title
  const title = document.createElement("h2");
  title.textContent = "Initiate Browser Flow";
  title.style.cssText = `
    font-size: 18px;
    margin: 0 0 16px;
    color: #1e293b;
    font-weight: 600;
  `;

  // Selection preview
  const previewContainer = document.createElement("div");
  previewContainer.style.cssText = `
    font-size: 12px;
    color: #475569;
    background: #f8fafc;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
    max-height: 80px;
    overflow-y: auto;
    border: 1px solid rgba(148, 163, 184, 0.2);
  `;
  const previewText = document.createElement("p");
  previewText.textContent = selectedText.length > 150 
    ? selectedText.substring(0, 150) + "..." 
    : selectedText;
  previewText.style.cssText = `
    margin: 0;
    font-style: italic;
    line-height: 1.4;
  `;
  previewContainer.appendChild(previewText);

  // Label
  const label = document.createElement("label");
  label.textContent = "Describe your task - add the note to notion, extract the data and save it to lead sheet. (optional)";
  label.style.cssText = `
    font-size: 12px;
    display: block;
    margin-bottom: 8px;
    color: #475569;
  `;

  // Textarea
  const textarea = document.createElement("textarea");
  textarea.id = "browser-flow-user-context";
  textarea.placeholder = "Add your thoughts";
  textarea.style.cssText = `
    width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(148, 163, 184, 0.3);
    padding: 10px;
    font-size: 13px;
    font-family: inherit;
    box-sizing: border-box;
    background: #ffffff;
    color: #1e293b;
    resize: vertical;
    min-height: 80px;
    margin-bottom: 16px;
  `;
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDialog();
    }
  });

  // Status message
  const status = document.createElement("div");
  status.id = "browser-flow-status";
  status.style.cssText = `
    margin-top: 12px;
    font-size: 11px;
    min-height: 16px;
    text-align: center;
  `;

  // Button container
  const buttonGroup = document.createElement("div");
  buttonGroup.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  // Cancel button
  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  cancelBtn.style.cssText = `
    flex: 1;
    border-radius: 999px;
    border: 0;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: #f1f5f9;
    color: #475569;
    font-family: inherit;
  `;
  cancelBtn.addEventListener("click", closeDialog);
  cancelBtn.addEventListener("mouseenter", () => {
    cancelBtn.style.opacity = "0.9";
  });
  cancelBtn.addEventListener("mouseleave", () => {
    cancelBtn.style.opacity = "1";
  });

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Initate your Flow";
  submitBtn.style.cssText = `
    flex: 1;
    border-radius: 999px;
    border: 0;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
    color: #ffffff;
    font-family: inherit;
  `;
  submitBtn.addEventListener("click", () => handleSubmit(selectedText, tabTitle, textarea.value.trim(), status, submitBtn));
  submitBtn.addEventListener("mouseenter", () => {
    submitBtn.style.opacity = "0.9";
  });
  submitBtn.addEventListener("mouseleave", () => {
    submitBtn.style.opacity = "1";
  });

  // Close on overlay click
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeDialog();
    }
  });

  function closeDialog() {
    overlay.remove();
  }

  function setStatus(text, kind) {
    status.textContent = text;
    status.style.color = kind === "error" ? "#dc2626" : "#16a34a";
  }

  function handleSubmit(selectedText, tabTitle, userContext, statusEl, btn) {
    setStatus("Sending to backend...", "ok");
    btn.disabled = true;

    const payload = {
      selectedText: selectedText,
    };
    if (userContext) {
      payload.userContext = userContext;
    }

    chrome.runtime.sendMessage(
      {
        type: "START_TASK",
        payload,
      },
      (response) => {
        if (!response || !response.ok) {
          setStatus(
            "Failed: " + (response && response.error ? response.error : "unknown error"),
            "error",
          );
          btn.disabled = false;
          return;
        }

        setStatus("Added to context successfully!", "ok");
        setTimeout(() => {
          closeDialog();
        }, 1500);
      },
    );
  }

  // Assemble dialog
  buttonGroup.appendChild(cancelBtn);
  buttonGroup.appendChild(submitBtn);
  dialog.appendChild(title);
  dialog.appendChild(previewContainer);
  dialog.appendChild(label);
  dialog.appendChild(textarea);
  dialog.appendChild(buttonGroup);
  dialog.appendChild(status);
  overlay.appendChild(dialog);

  // Add to page
  document.body.appendChild(overlay);

  // Focus textarea
  setTimeout(() => textarea.focus(), 100);
}
