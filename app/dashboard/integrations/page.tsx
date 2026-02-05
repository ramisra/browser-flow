"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Table, Trello, Workflow, Presentation } from "lucide-react";
import IntegrationCard from "@/components/IntegrationCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";
import {
  getIntegrationMetadataDefaults,
  getIntegrationMetadataFields,
} from "@/lib/integration-metadata";

interface IntegrationCapability {
  id: string;
  name: string;
  description: string;
}

interface IntegrationToken {
  integration_tool?: string;
  id?: string;
  integration_metadata?: Record<string, string>;
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
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationCapability | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const {
    data: capabilitiesData,
    isLoading: isLoadingCapabilities,
    error: capabilitiesError,
  } = useQuery({
    queryKey: ["integration-capabilities"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/capabilities");
      if (!res.ok) throw new Error("Failed to fetch integration capabilities");
      return res.json();
    },
  });

  const {
    data: tokensData,
    isLoading: isLoadingTokens,
    error: tokensError,
  } = useQuery({
    queryKey: ["integration-tokens"],
    queryFn: async () => {
      const res = await fetch("/api/integrations/tokens", {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch integration tokens");
      return res.json();
    },
  });

  const enableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedIntegration) {
        throw new Error("No integration selected");
      }

      const res = await fetch("/api/integrations/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getUserGuestIdHeader(),
        },
        body: JSON.stringify({
          integration_tool: selectedIntegration.id,
          api_key: apiKey,
          integration_metadata: metadataValues,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to enable integration");
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-tokens"] });
      setIsConfigModalOpen(false);
      setSelectedIntegration(null);
    },
  });

  const normalizedTokens = useMemo<IntegrationToken[]>(() => {
    if (!tokensData) return [];
    if (Array.isArray(tokensData)) return tokensData;
    if (Array.isArray(tokensData.tokens)) return tokensData.tokens;
    if (Array.isArray(tokensData.integrations)) return tokensData.integrations;
    return [];
  }, [tokensData]);

  const capabilities = useMemo<IntegrationCapability[]>(() => {
    return Array.isArray(capabilitiesData?.integrations) ? capabilitiesData.integrations : [];
  }, [capabilitiesData]);

  const tokenIds = useMemo(() => {
    return new Set(
      normalizedTokens
        .map((token) => token.integration_tool ?? token.id)
        .filter((id): id is string => Boolean(id)),
    );
  }, [normalizedTokens]);

  const tokensByIntegration = useMemo(() => {
    return normalizedTokens.reduce<Record<string, IntegrationToken>>((acc, token) => {
      const key = token.integration_tool ?? token.id;
      if (key) {
        acc[key] = token;
      }
      return acc;
    }, {});
  }, [normalizedTokens]);

  const enabledIntegrations = useMemo<IntegrationCapability[]>(() => {
    const known = capabilities.filter((capability) => tokenIds.has(capability.id));
    const knownIds = new Set(known.map((capability) => capability.id));
    const unknown = normalizedTokens
      .map((token) => token.integration_tool ?? token.id)
      .filter((id): id is string => Boolean(id) && !knownIds.has(id))
      .map((id) => ({
        id,
        name: id,
        description: "Enabled integration",
      }));

    return [...known, ...unknown];
  }, [capabilities, normalizedTokens, tokenIds]);

  const availableIntegrations = useMemo<IntegrationCapability[]>(() => {
    return capabilities.filter((capability) => !tokenIds.has(capability.id));
  }, [capabilities, tokenIds]);

  const metadataFields = selectedIntegration
    ? getIntegrationMetadataFields(selectedIntegration.id)
    : [];

  const isSaveDisabled = useMemo(() => {
    if (!apiKey.trim()) return true;
    const missingRequired = metadataFields.some(
      (field) => field.required && !metadataValues[field.key]?.trim(),
    );
    return missingRequired || enableMutation.isLoading;
  }, [apiKey, metadataFields, metadataValues, enableMutation.isLoading]);

  const handleEnable = (integration: IntegrationCapability) => {
    setSelectedIntegration(integration);
    const defaults = getIntegrationMetadataDefaults(integration.id);
    const tokenMetadata = tokensByIntegration[integration.id]?.integration_metadata ?? {};
    setMetadataValues({ ...defaults, ...tokenMetadata });
    setApiKey("");
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
      {isLoadingCapabilities || isLoadingTokens ? (
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
      ) : capabilitiesError || tokensError ? (
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
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
          {enabledIntegrations.length === 0 && availableIntegrations.length === 0 ? (
            <div
              className="card"
              style={{
                padding: "var(--spacing-xl)",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              No integrations available yet.
            </div>
          ) : (
            <>
              <div>
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    marginBottom: "var(--spacing-sm)",
                  }}
                >
                  Enabled Integrations
                </h2>
                {enabledIntegrations.length === 0 ? (
                  <div
                    className="card"
                    style={{
                      padding: "var(--spacing-md)",
                      color: "var(--text-muted)",
                    }}
                  >
                    No integrations enabled yet.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: "var(--spacing-lg)",
                    }}
                  >
                    {enabledIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        name={integration.name}
                        description={integration.description}
                        icon={iconMap[integration.id] || <FileText size={24} />}
                        status="enabled"
                        onConfigure={() => handleEnable(integration)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {availableIntegrations.length > 0 && (
                <div>
                  <h2
                    style={{
                      fontSize: "1.125rem",
                      fontWeight: 600,
                      marginBottom: "var(--spacing-sm)",
                    }}
                  >
                    Available Integrations
                  </h2>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                      gap: "var(--spacing-lg)",
                    }}
                  >
                    {availableIntegrations.map((integration) => (
                      <IntegrationCard
                        key={integration.id}
                        name={integration.name}
                        description={integration.description}
                        icon={iconMap[integration.id] || <FileText size={24} />}
                        status="available"
                        onEnable={() => handleEnable(integration)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
                API Key
              </label>
              <input
                type="password"
                placeholder="Enter API key"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
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
            {metadataFields.map((field) => (
              <div key={field.key}>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  {field.label}
                </label>
                <input
                  type={field.inputType ?? "text"}
                  placeholder={field.placeholder}
                  value={metadataValues[field.key] ?? ""}
                  onChange={(event) =>
                    setMetadataValues((prev) => ({
                      ...prev,
                      [field.key]: event.target.value,
                    }))
                  }
                  style={{
                    width: "100%",
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-primary)",
                  }}
                />
                {field.helpText && (
                  <p
                    style={{
                      marginTop: "var(--spacing-xs)",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {field.helpText}
                  </p>
                )}
              </div>
            ))}
            {enableMutation.isError && (
              <div style={{ color: "var(--status-error)", fontSize: "0.875rem" }}>
                {(enableMutation.error as Error).message}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: "var(--spacing-md)",
                justifyContent: "flex-end",
                marginTop: "var(--spacing-md)",
              }}
            >
              <button
                onClick={() => {
                  setIsConfigModalOpen(false);
                  setSelectedIntegration(null);
                }}
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
                onClick={() => enableMutation.mutate()}
                disabled={isSaveDisabled}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  background: "linear-gradient(135deg, #4f46e5, #22c55e, #f97316)",
                  color: "var(--text-dark)",
                  fontWeight: 600,
                  cursor: "pointer",
                  opacity: isSaveDisabled ? 0.6 : 1,
                }}
              >
                {enableMutation.isLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
