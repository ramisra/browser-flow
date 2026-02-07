"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { initGuestIdSync } from "@/lib/user-guest-id";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initGuestIdSync();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, var(--landing-accent-glow), transparent), var(--landing-bg)",
        color: "var(--landing-text)",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          marginLeft: "260px",
          display: "flex",
          flexDirection: "column",
        }}
        className="dashboard-content"
      >
        {/* Main Content */}
        <main
          style={{
            flex: 1,
            padding: "var(--spacing-xl)",
            overflow: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
