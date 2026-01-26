"use client";

import React from "react";
import { format } from "date-fns";
import { ExternalLink, Trash2, Eye } from "lucide-react";

interface Context {
  context_id: string;
  url?: string;
  context_tags?: string[];
  raw_content?: string;
  user_defined_context?: string;
  context_type: "text" | "image" | "video";
  timestamp: string;
  parent_topic?: string | null;
  has_children?: boolean;
}

interface KnowledgeListProps {
  contexts: Context[];
  onViewDetails?: (contextId: string) => void;
  onDelete?: (contextId: string) => void;
}

export default function KnowledgeList({
  contexts,
  onViewDetails,
  onDelete,
}: KnowledgeListProps) {
  if (!contexts || contexts.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-2xl)",
          color: "var(--text-muted)",
        }}
      >
        No contexts found
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      {contexts.map((context) => (
        <div
          key={context.context_id}
          className="card"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
            position: "relative",
          }}
        >
          {/* Three-dot menu */}
          <div
            style={{
              position: "absolute",
              top: "var(--spacing-md)",
              right: "var(--spacing-md)",
            }}
          >
            <button
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-md)",
                border: "none",
                backgroundColor: "transparent",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "1.25rem",
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
              ⋮
            </button>
          </div>

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "var(--spacing-md)",
            }}
          >
            <div style={{ flex: 1 }}>
              {context.url && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-sm)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  <ExternalLink size={14} color="var(--text-muted)" />
                  <a
                    href={context.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--accent-blue)",
                      textDecoration: "none",
                    }}
                  >
                    {context.url.length > 60
                      ? `${context.url.substring(0, 60)}...`
                      : context.url}
                  </a>
                </div>
              )}
              {context.user_defined_context && (
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                    marginTop: "var(--spacing-xs)",
                  }}
                >
                  {context.user_defined_context}
                </p>
              )}
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "var(--radius-sm)",
                backgroundColor:
                  context.context_type === "text"
                    ? "rgba(59, 130, 246, 0.1)"
                    : context.context_type === "image"
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(249, 115, 22, 0.1)",
                color:
                  context.context_type === "text"
                    ? "var(--accent-blue)"
                    : context.context_type === "image"
                      ? "var(--accent-green)"
                      : "var(--accent-orange)",
                textTransform: "capitalize",
              }}
            >
              {context.context_type}
            </span>
          </div>

          {/* Content Preview */}
          {context.raw_content && (
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                marginTop: "var(--spacing-xs)",
              }}
            >
              {context.raw_content.length > 200
                ? `${context.raw_content.substring(0, 200)}...`
                : context.raw_content}
            </p>
          )}

          {/* Tags */}
          {context.context_tags && context.context_tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "var(--spacing-xs)",
                marginTop: "var(--spacing-xs)",
              }}
            >
              {context.context_tags.map((tag, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.125rem 0.5rem",
                    borderRadius: "var(--radius-sm)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "var(--spacing-sm)",
              paddingTop: "var(--spacing-sm)",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
              }}
            >
              {format(new Date(context.timestamp), "MMM d, yyyy HH:mm")}
            </span>
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-sm)",
              }}
            >
              {onViewDetails && (
                <button
                  onClick={() => onViewDetails(context.context_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-xs)",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--text-secondary)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <Eye size={14} />
                  View
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(context.context_id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-xs)",
                    padding: "0.375rem 0.75rem",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    color: "var(--status-error)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    transition: "all var(--transition-base)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
