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
    bgColor: "var(--status-success-tint)",
    label: "Completed",
  },
  processing: {
    color: "var(--status-processing)",
    bgColor: "var(--status-processing-tint)",
    label: "In Process",
  },
  failed: {
    color: "var(--status-error)",
    bgColor: "var(--status-error-tint)",
    label: "Failed",
  },
  pending: {
    color: "var(--text-muted)",
    bgColor: "var(--status-pending-tint)",
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
