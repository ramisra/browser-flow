"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  Plug,
  User,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const navigation: NavItem[] = [
  { name: "Knowledge Base", href: "/dashboard/knowledge", icon: <BookOpen size={20} /> },
  { name: "Tasks", href: "/dashboard/tasks", icon: <CheckSquare size={20} /> },
  { name: "Integrations", href: "/dashboard/integrations", icon: <Plug size={20} /> },
  { name: "Profile", href: "/dashboard/profile", icon: <User size={20} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: "fixed",
          top: "var(--spacing-md)",
          left: "var(--spacing-md)",
          zIndex: 1001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "40px",
          height: "40px",
          borderRadius: "999px",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          backgroundColor: "var(--landing-bg-card)",
          color: "var(--landing-text)",
          cursor: "pointer",
          backdropFilter: "blur(12px)",
        }}
        className="mobile-menu-button"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "260px",
          backgroundColor: "var(--landing-bg-card)",
          borderRight: "1px solid rgba(148, 163, 184, 0.12)",
          padding: "var(--spacing-lg)",
          overflowY: "auto",
          zIndex: 1000,
          transform: isMobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform var(--transition-base)",
          backdropFilter: "blur(12px)",
        }}
        className="sidebar"
      >
        {/* Logo/Branding */}
        <div
          style={{
            marginBottom: "var(--spacing-2xl)",
            paddingBottom: "var(--spacing-lg)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
          }}
        >
          <h1
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--landing-text)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
            }}
          >
            <span
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "var(--radius-md)",
                background: "var(--landing-accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0b0b14",
              }}
            >
              <Sparkles size={18} strokeWidth={2} />
            </span>
            Browser Flow
          </h1>
        </div>

        {/* Menu Heading */}
        <div style={{ marginBottom: "var(--spacing-md)" }}>
          <p
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--landing-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            MENU
          </p>
        </div>

        {/* Navigation Items */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-xs)",
          }}
        >
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-md)",
                  padding: "var(--spacing-md)",
                  borderRadius: "999px",
                  color: isActive ? "#0b0b14" : "var(--landing-text)",
                  backgroundColor: isActive
                    ? "var(--landing-accent)"
                    : "transparent",
                  textDecoration: "none",
                  transition: "all var(--transition-base)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    color: isActive ? "#0b0b14" : "var(--landing-text-muted)",
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "0.875rem",
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {item.name}
                </span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      padding: "0.125rem 0.375rem",
                      borderRadius: "var(--radius-full)",
                      backgroundColor: "var(--landing-accent)",
                      color: "#0b0b14",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "var(--overlay-bg-light)",
            zIndex: 999,
          }}
          className="mobile-overlay"
        />
      )}
    </>
  );
}
