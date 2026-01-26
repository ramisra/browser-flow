"use client";

import React from "react";

type StatusType = "completed" | "processing" | "failed" | "pending";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<
  StatusType,
  { color: string; bgColor: string; label: string }
> = {
  completed: {
    color: "var(--status-success)",
    bgColor: "rgba(34, 197, 94, 0.1)",
    label: "Completed",
  },
  processing: {
    color: "var(--status-processing)",
    bgColor: "rgba(234, 179, 8, 0.1)",
    label: "In Process",
  },
  failed: {
    color: "var(--status-error)",
    bgColor: "rgba(239, 68, 68, 0.1)",
    label: "Failed",
  },
  pending: {
    color: "var(--text-muted)",
    bgColor: "rgba(148, 163, 184, 0.1)",
    label: "Pending",
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.25rem 0.75rem",
        borderRadius: "var(--radius-full)",
        fontSize: "0.75rem",
        fontWeight: 500,
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}40`,
      }}
    >
      {displayLabel}
    </span>
  );
}
