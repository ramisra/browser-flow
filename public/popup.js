const statusEl = document.getElementById("status");
const taskTypeEl = document.getElementById("taskType");
const userContextEl = document.getElementById("userContext");
const btn = document.getElementById("startBtn");

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className =
    "status " + (kind === "error" ? "status-error" : "status-ok");
}

btn.addEventListener("click", () => {
  setStatus("Collecting current tab URL...", "ok");

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.url) {
      setStatus("Unable to get active tab URL.", "error");
      return;
    }

    const userContext = userContextEl.value.trim();
    const payload = {
      url: tab.url,
      taskType: taskTypeEl.value,
      metadata: {
        title: tab.title || null,
      },
    };

    // Include user context if provided
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
            "Failed to start task: " +
              (response && response.error ? response.error : "unknown error"),
            "error",
          );
          return;
        }
        setStatus(
          "Task started. You'll get a notification when it completes.",
          "ok",
        );
        // Clear the textarea after successful submission
        userContextEl.value = "";
      },
    );
  });
});

