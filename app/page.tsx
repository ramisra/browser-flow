"use client";

import { FormEvent, useState } from "react";

type TaskType =
  | "create_note"
  | "create_action_items"
  | "add_to_context"
  | "reason_about_page"
  | "extract_data";

export default function Home() {
  const [backendUrl, setBackendUrl] = useState(
    "http://localhost:3000",
  );
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && (window as any).chrome?.storage?.sync) {
      (window as any).chrome.storage.sync.set({ browserFlowBackendUrl: backendUrl }, () => {
        setStatus("Saved backend URL for the extension.");
        setTimeout(() => setStatus(null), 2500);
      });
    } else {
      setStatus("Chrome extension API not available. This feature only works in the browser extension context.");
      setTimeout(() => setStatus(null), 2500);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, #dbeafe, transparent 55%), radial-gradient(circle at bottom right, #dcfce7, transparent 55%)",
        padding: "2rem",
      }}
    >
      <section
        style={{
          maxWidth: 640,
          width: "100%",
          backgroundColor: "rgba(255, 255, 255, 0.98)",
          borderRadius: "1.5rem",
          padding: "2rem",
          color: "#1e293b",
          boxShadow:
            "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(148,163,184,0.2)",
          backdropFilter: "blur(18px)",
        }}
      >
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 700,
            marginBottom: "0.75rem",
          }}
        >
          Browser Flow Control Panel
        </h1>
        <p
          style={{
            color: "#475569",
            marginBottom: "1.5rem",
          }}
        >
          This Next.js app hosts the API your browser extension talks to. Configure
          your backend here, then load the extension to send URLs for tasks like
          notes, action items, and page reasoning.
        </p>

        <form onSubmit={handleSave} style={{ display: "grid", gap: "0.75rem" }}>
          <label style={{ fontSize: "0.9rem", color: "#1e293b" }}>
            Backend API Base URL
            <input
              type="url"
              required
              value={backendUrl}
              onChange={(e) => setBackendUrl(e.target.value)}
              placeholder="http://localhost:3000"
              style={{
                width: "100%",
                marginTop: "0.35rem",
                padding: "0.6rem 0.75rem",
                borderRadius: "0.75rem",
                border: "1px solid rgba(148,163,184,0.3)",
                backgroundColor: "#ffffff",
                color: "#1e293b",
                outline: "none",
              }}
            />
          </label>

          <button
            type="submit"
            style={{
              marginTop: "0.75rem",
              padding: "0.65rem 1rem",
              borderRadius: "999px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Save for Extension
          </button>

          {status && (
            <div
              style={{
                marginTop: "0.5rem",
                fontSize: "0.85rem",
                color: "#16a34a",
              }}
            >
              {status}
            </div>
          )}
        </form>

        <div
          style={{
            marginTop: "1.75rem",
            paddingTop: "1rem",
            borderTop: "1px dashed rgba(148,163,184,0.3)",
            fontSize: "0.85rem",
            color: "#475569",
          }}
        >
          <p style={{ marginBottom: "0.35rem", fontWeight: 600 }}>
            What the extension does:
          </p>
          <ul style={{ paddingLeft: "1.1rem", lineHeight: 1.5 }}>
            <li>Captures the active tab URL</li>
            <li>
              Sends it to your backend with a task type like{" "}
              <code>create_note</code> or <code>extract_data</code>
            </li>
            <li>
              Polls for completion and shows a browser notification when the task
              is done
            </li>
          </ul>
        </div>

        <div
          style={{
            marginTop: "1.5rem",
            paddingTop: "1rem",
            borderTop: "1px dashed rgba(148,163,184,0.3)",
          }}
        >
          <a
            href="/dashboard/knowledge"
            style={{
              display: "inline-block",
              padding: "0.65rem 1.5rem",
              borderRadius: "999px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            Open Dashboard →
          </a>
        </div>
      </section>
    </main>
  );
}

