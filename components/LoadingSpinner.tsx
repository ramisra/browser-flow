"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function LoadingSpinner({
  size = "md",
  className = "",
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "16px",
    md: "24px",
    lg: "32px",
  };

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        width: sizeMap[size],
        height: sizeMap[size],
        border: `2px solid var(--border-color)`,
        borderTopColor: "var(--accent-blue)",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
    />
  );
}
