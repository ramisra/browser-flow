"use client";

import React from "react";
import { Settings } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  icon?: React.ReactNode;
  status: "enabled" | "disabled";
  usageCount?: number;
  onToggle: (enabled: boolean) => void;
  onConfigure?: () => void;
}

export default function IntegrationCard({
  name,
  icon,
  status,
  usageCount = 0,
  onToggle,
  onConfigure,
}: IntegrationCardProps) {
  const isEnabled = status === "enabled";

  return (
    <div
      className="card"
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
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "transparent",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all var(--transition-base)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--bg-primary)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
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
              borderRadius: "var(--radius-md)",
              backgroundColor: isEnabled
                ? "rgba(59, 130, 246, 0.1)"
                : "var(--bg-primary)",
              color: isEnabled ? "var(--accent-blue)" : "var(--text-muted)",
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
              color: "var(--text-primary)",
              marginBottom: "0.25rem",
            }}
          >
            {name}
          </h3>
          {usageCount > 0 && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
              }}
            >
              Used in {usageCount} task{usageCount !== 1 ? "s" : ""}
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
            color: isEnabled ? "var(--status-success)" : "var(--text-muted)",
          }}
        >
          {isEnabled ? "Enabled" : "Disabled"}
        </span>
        <button
          onClick={() => onToggle(!isEnabled)}
          style={{
            position: "relative",
            width: "44px",
            height: "24px",
            borderRadius: "var(--radius-full)",
            border: "none",
            backgroundColor: isEnabled ? "var(--accent-blue)" : "var(--border-color-dark)",
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
              backgroundColor: "white",
              transition: "left var(--transition-base)",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            }}
          />
        </button>
      </div>
    </div>
  );
}
