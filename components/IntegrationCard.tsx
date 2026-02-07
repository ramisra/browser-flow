"use client";

import React from "react";
import { Settings } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  description?: string;
  icon?: React.ReactNode;
  status: "enabled" | "available";
  onToggle?: (enabled: boolean) => void;
  onEnable?: () => void;
  onConfigure?: () => void;
}

export default function IntegrationCard({
  name,
  description,
  icon,
  status,
  onToggle,
  onEnable,
  onConfigure,
}: IntegrationCardProps) {
  const isEnabled = status === "enabled";
  const statusLabel = isEnabled ? "Enabled" : "Available";
  const statusColor = isEnabled ? "var(--status-success)" : "var(--landing-text-muted)";

  return (
    <div
      className="card-landing"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "var(--spacing-md)",
          right: "var(--spacing-md)",
          display: "flex",
          gap: "var(--spacing-sm)",
        }}
      >
        {onConfigure && (
          <button
            onClick={onConfigure}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "999px",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              backgroundColor: "transparent",
              color: "var(--landing-text-muted)",
              cursor: "pointer",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
              e.currentTarget.style.color = "var(--landing-text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--landing-text-muted)";
            }}
          >
            <Settings size={16} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
        }}
      >
        {icon && (
          <div
            style={{
              width: "48px",
              height: "48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              backgroundColor: isEnabled
                ? "var(--landing-accent-glow)"
                : "var(--landing-bg)",
              color: isEnabled ? "var(--landing-accent)" : "var(--landing-text-muted)",
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--landing-text)",
              marginBottom: "0.25rem",
            }}
          >
            {name}
          </h3>
          {description && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--landing-text-muted)",
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: "0.875rem",
            color: statusColor,
          }}
        >
          {statusLabel}
        </span>
        {onToggle && (
          <button
            onClick={() => onToggle(!isEnabled)}
            style={{
              position: "relative",
              width: "44px",
              height: "24px",
              borderRadius: "var(--radius-full)",
              border: "none",
              backgroundColor: isEnabled ? "var(--landing-accent)" : "rgba(148, 163, 184, 0.3)",
              cursor: "pointer",
              transition: "all var(--transition-base)",
              padding: "2px",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: "2px",
                left: isEnabled ? "22px" : "2px",
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                backgroundColor: isEnabled ? "#0b0b14" : "var(--landing-text)",
                transition: "left var(--transition-base)",
                boxShadow: "var(--shadow-sm)",
              }}
            />
          </button>
        )}
        {!onToggle && onEnable && (
          <button
            onClick={onEnable}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: "1px solid var(--landing-accent-glow)",
              backgroundColor: "transparent",
              color: "var(--landing-accent)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: 600,
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--landing-accent)";
              e.currentTarget.style.color = "#0b0b14";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--landing-accent)";
            }}
          >
            Enable
          </button>
        )}
      </div>
    </div>
  );
}
