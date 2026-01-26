const TASK_API_BASE =
  "https://localhost:3000/api/tasks".replace("https://", "http://");

// Create context menu on extension install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addSelectionToContext",
    title: "Add selection to Browser Flow",
    contexts: ["selection"],
  });
});

/**
 * Poll task status until completed/failed or max retries reached.
 * Not production-optimised, but good to illustrate the flow.
 */
async function pollTaskStatus(taskId) {
  const maxAttempts = 10;
  const delayMs = 3000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((res) => setTimeout(res, delayMs));

    try {
      const url = `${TASK_API_BASE}?id=${encodeURIComponent(taskId)}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const data = await resp.json();

      if (data.status === "completed" || data.status === "failed") {
        const title =
          data.status === "completed"
            ? "Browser Flow task completed"
            : "Browser Flow task failed";
        const message =
          data.status === "completed"
            ? data.result?.message ||
              "Your browsing task has finished processing."
            : "Your browsing task did not complete successfully.";

        chrome.notifications?.create("", {
          type: "basic",
          iconUrl: "icon-128.png",
          title,
          message,
        });
        return;
      }
    } catch (e) {
      // ignore transient errors; we retry
      console.warn("[Browser Flow] Poll error", e);
    }
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "addSelectionToContext") {
    const selectedText = info.selectionText;
    
    console.log("[Browser Flow] Context menu clicked", {
      selectionText: selectedText,
      tabUrl: tab?.url,
      info: info,
    });
    
    if (!selectedText) {
      console.error("[Browser Flow] No selection text available");
      return;
    }
    
    if (!tab) {
      console.error("[Browser Flow] No tab available");
      return;
    }

    // Send message to content script to show dialog in the same window
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_CONTEXT_DIALOG",
        data: {
          selectedText: selectedText,
          tabTitle: tab.title || null,
        },
      });
      console.log("[Browser Flow] Sent message to content script to show dialog");
    } catch (e) {
      console.error("[Browser Flow] Error sending message to content script", e);
      // Fallback: inject content script if not already loaded
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content-script.js"],
        });
        // Retry sending message
        await chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_CONTEXT_DIALOG",
          data: {
            selectedText: selectedText,
            tabTitle: tab.title || null,
          },
        });
      } catch (fallbackError) {
        console.error("[Browser Flow] Fallback also failed", fallbackError);
        // Final fallback: send directly without dialog
        await sendSelectedTextToBackend(selectedText, tab.title || null);
      }
    }
  }
});

// Helper function to send selected text to backend
async function sendSelectedTextToBackend(selectedText, tabTitle, userContext = null) {
  try {
    const payload = {
      selectedText: selectedText,
      taskType: "add_to_context",
      metadata: {
        title: tabTitle,
      },
    };

    if (userContext) {
      payload.userContext = userContext;
    }

    console.log("[Browser Flow] Sending payload:", payload);

    const resp = await fetch(TASK_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      console.error("[Browser Flow] Failed to create task");
      return;
    }

    const data = await resp.json();
    if (data.id) {
      pollTaskStatus(data.id).catch((e) =>
        console.error("[Browser Flow] Polling failed", e),
      );
    }
  } catch (e) {
    console.error("[Browser Flow] Error talking to API", e);
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_TASK") {
    (async () => {
      try {
        const { url, selectedText, taskType, userContext, metadata } = message.payload;
        const payload = { taskType, metadata: metadata || {} };
        
        // Include url or selectedText (or both) in the payload
        if (url) {
          payload.url = url;
        }
        if (selectedText) {
          payload.selectedText = selectedText;
        }
        // Include user context if provided
        if (userContext) {
          payload.userContext = userContext;
        }

        const resp = await fetch(TASK_API_BASE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!resp.ok) {
          sendResponse({ ok: false, error: "Failed to create task" });
          return;
        }

        const data = await resp.json();
        if (data.id) {
          pollTaskStatus(data.id).catch((e) =>
            console.error("[Browser Flow] Polling failed", e),
          );
        }

        sendResponse({ ok: true, taskId: data.id });
      } catch (e) {
        console.error("[Browser Flow] Error talking to API", e);
        sendResponse({ ok: false, error: String(e) });
      }
    })();

    // keep message channel open for async response
    return true;
  }
});

