"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { User, Calendar, CreditCard, BarChart3, RefreshCw, Copy, Check } from "lucide-react";
import { getUserGuestId, getUserGuestIdHeader, regenerateUserGuestId } from "@/lib/user-guest-id";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ProfilePage() {
  const [copied, setCopied] = useState(false);
  const [userGuestId, setUserGuestId] = useState(getUserGuestId());

  const {
    data: profileData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await fetch("/api/profile", {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const handleCopyGuestId = () => {
    navigator.clipboard.writeText(userGuestId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateGuestId = () => {
    if (confirm("Are you sure you want to generate a new User Guest ID? This will create a new identity.")) {
      const newId = regenerateUserGuestId();
      setUserGuestId(newId);
      refetch();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-lg)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--spacing-md)",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "var(--spacing-xs)",
            }}
          >
            Profile
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            Manage your account and preferences
          </p>
        </div>
        <button
          onClick={() => refetch()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            padding: "var(--spacing-sm) var(--spacing-md)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-primary)",
            cursor: "pointer",
            fontSize: "0.875rem",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--bg-card)";
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--spacing-2xl)",
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div
          className="card"
          style={{
            padding: "var(--spacing-xl)",
            textAlign: "center",
            color: "var(--status-error)",
          }}
        >
          Error loading profile. Please try again.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "var(--spacing-lg)",
          }}
        >
          {/* User Details Card */}
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "var(--accent-blue)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <User size={24} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {profileData?.displayName || "User"}
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  User Account
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  User Guest ID
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "var(--spacing-sm)",
                    alignItems: "center",
                  }}
                >
                  <code
                    style={{
                      flex: 1,
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--bg-primary)",
                      color: "var(--text-secondary)",
                      fontSize: "0.75rem",
                      border: "1px solid var(--border-color)",
                      fontFamily: "monospace",
                    }}
                  >
                    {userGuestId}
                  </code>
                  <button
                    onClick={handleCopyGuestId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "transparent",
                      color: copied ? "var(--status-success)" : "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all var(--transition-base)",
                    }}
                    title="Copy to clipboard"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={handleRegenerateGuestId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      transition: "all var(--transition-base)",
                    }}
                    title="Regenerate ID"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>

              {profileData?.accountCreated && (
                <div>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "var(--spacing-xs)",
                      display: "block",
                    }}
                  >
                    Account Created
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <Calendar size={14} />
                    {format(new Date(profileData.accountCreated), "MMM d, yyyy")}
                  </div>
                </div>
              )}

              {profileData?.lastActivity && (
                <div>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "var(--spacing-xs)",
                      display: "block",
                    }}
                  >
                    Last Activity
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-sm)",
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    <Calendar size={14} />
                    {format(new Date(profileData.lastActivity), "MMM d, yyyy HH:mm")}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Card */}
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-blue)",
                }}
              >
                <CreditCard size={24} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Subscription
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {profileData?.subscription?.plan || "Free"} Plan
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div
                style={{
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: "var(--spacing-xs)",
                  }}
                >
                  {profileData?.subscription?.plan || "Free"}
                </div>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Current plan
                </p>
              </div>

              {profileData?.subscription?.billingCycle && (
                <div>
                  <label
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      marginBottom: "var(--spacing-xs)",
                      display: "block",
                    }}
                  >
                    Billing Cycle
                  </label>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    {profileData.subscription.billingCycle}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Statistics Card */}
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
                marginBottom: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "rgba(34, 197, 94, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-green)",
                }}
              >
                <BarChart3 size={24} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  Usage Statistics
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Your activity overview
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Total Tasks
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profileData?.subscription?.usage?.totalTasks || 0}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Total Contexts
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profileData?.subscription?.usage?.totalContexts || 0}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Active Integrations
                </span>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {profileData?.subscription?.usage?.activeIntegrations || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
