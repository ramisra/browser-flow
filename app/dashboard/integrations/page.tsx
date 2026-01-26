"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Table, Trello, Workflow, Presentation } from "lucide-react";
import IntegrationCard from "@/components/IntegrationCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";

interface Integration {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  usageCount: number;
  description: string;
}

const iconMap: Record<string, React.ReactNode> = {
  "google-sheets": <FileSpreadsheet size={24} />,
  notion: <FileText size={24} />,
  excel: <Table size={24} />,
  trello: <Trello size={24} />,
  airflow: <Workflow size={24} />,
  miro: <Presentation size={24} />,
};

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: integrationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await fetch("/api/integrations");
      if (!res.ok) throw new Error("Failed to fetch integrations");
      return res.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ integrationId, enabled }: { integrationId: string; enabled: boolean }) => {
      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle",
          integrationId,
          enabled,
        }),
      });
      if (!res.ok) throw new Error("Failed to toggle integration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
    },
  });

  const handleToggle = (integrationId: string, enabled: boolean) => {
    toggleMutation.mutate({ integrationId, enabled });
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsConfigModalOpen(true);
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
      <div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "var(--spacing-xs)",
          }}
        >
          Integrations
        </h1>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--text-muted)",
          }}
        >
          Connect and manage your productivity tools
        </p>
      </div>

      {/* Integrations Grid */}
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
          Error loading integrations. Please try again.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "var(--spacing-lg)",
          }}
        >
          {integrationsData?.integrations?.map((integration: Integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              icon={iconMap[integration.id] || <FileText size={24} />}
              status={integration.enabled ? "enabled" : "disabled"}
              usageCount={integration.usageCount}
              onToggle={(enabled) => handleToggle(integration.id, enabled)}
              onConfigure={() => handleConfigure(integration)}
            />
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedIntegration(null);
        }}
        title={`Configure ${selectedIntegration?.name}`}
        size="md"
      >
        {selectedIntegration && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.875rem",
              }}
            >
              {selectedIntegration.description}
            </p>
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
                API Key / Configuration
              </label>
              <input
                type="text"
                placeholder="Enter API key or configuration..."
                style={{
                  width: "100%",
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-md)",
                justifyContent: "flex-end",
                marginTop: "var(--spacing-md)",
              }}
            >
              <button
                onClick={() => setIsConfigModalOpen(false)}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "transparent",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // TODO: Save configuration
                  setIsConfigModalOpen(false);
                }}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #22c55e, #f97316)",
                  color: "var(--text-dark)",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
