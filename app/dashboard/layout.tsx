"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
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
