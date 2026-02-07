"use client";

import Link from "next/link";
import {
  LayoutList,
  LayoutGrid,
  FolderKanban,
  Zap,
  Play,
  Sparkles,
} from "lucide-react";
import AnimatedWords from "@/components/AnimatedWords";

const VIDEO_PITCH_URL = "https://www.youtube.com/watch?v=VIDEO_ID";

const FEATURES = [
  {
    icon: LayoutList,
    title: "Smart Tab Orchestra",
    description:
      "AI that turns fragmented research across 20+ tabs into organized, actionable knowledge.",
  },
  {
    icon: LayoutGrid,
    title: "Productivity Hub",
    description:
      "Single workspace that syncs insights across all your tools — no copy-paste, no app-switching.",
  },
  {
    icon: FolderKanban,
    title: "Universal Workspace",
    description:
      "Notes, tasks, data — managed from your browser. One intelligent interface to organize everything and execute anywhere.",
  },
  {
    icon: Zap,
    title: "Intent-to-Action Automation",
    description:
      "One-click flows that route browser content to predefined destinations — databases, docs, boards, calendars, etc.",
  },
];

export default function Home() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, var(--landing-accent-glow), transparent), var(--landing-bg)",
        color: "var(--landing-text)",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--landing-text)",
            textDecoration: "none",
            fontWeight: 700,
            fontSize: "1.25rem",
          }}
        >
          <Sparkles size={22} color="var(--landing-accent)" />
          Browser Flow
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link
            href="/dashboard/knowledge"
            style={{
              color: "var(--landing-text-muted)",
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/knowledge"
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "999px",
              background: "var(--landing-accent)",
              color: "#0b0b14",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Explore apps
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "4rem 1.5rem 5rem",
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
            padding: "0.35rem 0.85rem",
            borderRadius: "999px",
            border: "1px solid var(--landing-accent-glow)",
            color: "var(--landing-accent)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <Sparkles size={14} />
          AI-powered browsing, one workspace
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: "1.25rem",
            letterSpacing: "-0.02em",
            color: "#fff",
          }}
        >
          Stop switching apps.
          <br />
          Start staying in flow.
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--landing-text-muted)",
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}
        >
          AI agents turn your browsing into organized work across your
          productivity stack{" "}
          <span style={{ fontSize: "1.35rem", color: "#fff", fontWeight: 600 }}>
            <AnimatedWords />
          </span>
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            justifyContent: "center",
          }}
        >
          <Link
            href="/dashboard/knowledge"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, var(--landing-accent) 0%, #7c3aed 100%)",
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "1rem",
              boxShadow: "0 4px 20px var(--landing-accent-glow)",
            }}
          >
            Explore apps
          </Link>
          <a
            href={VIDEO_PITCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "999px",
              background: "var(--landing-bg-card)",
              color: "var(--landing-text)",
              fontWeight: 600,
              textDecoration: "none",
              fontSize: "1rem",
              border: "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            <Play size={18} fill="currentColor" />
            Watch video
          </a>
        </div>
      </section>

      {/* Feature section with headline */}
      <section
        style={{
          padding: "2rem 1.5rem 4rem",
          maxWidth: 1100,
          margin: "0 auto",
        }}
      >
        <header style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h2
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.25rem)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "0.75rem",
            }}
          >
            Core Features of our Tools
          </h2>
          <p
            style={{
              fontSize: "1.05rem",
              color: "var(--landing-text-muted)",
              lineHeight: 1.7,
              maxWidth: 640,
              margin: "0 auto",
            }}
          >
            Unlock the Potential of Innovation. Discover the Advanced AI Tools
            Transforming Your Ideas into Reality with Unmatched Precision and
            Intelligence.
          </p>
        </header>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              style={{
                background: "var(--landing-bg-card)",
                borderRadius: "1.25rem",
                padding: "1.75rem",
                border: "1px solid rgba(148, 163, 184, 0.08)",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--landing-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1rem",
                }}
              >
                <Icon size={24} color="#0b0b14" strokeWidth={2} />
              </div>
              <h3
                style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: "0.5rem",
                  color: "var(--landing-text)",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: "0.95rem",
                  color: "var(--landing-text-muted)",
                  lineHeight: 1.6,
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
