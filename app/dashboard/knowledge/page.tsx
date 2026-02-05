"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";

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

interface GraphNode {
  id: string;
  label?: string;
  url?: string;
  tags?: string[];
  content_preview?: string;
  context_type?: "text" | "image" | "video";
  timestamp?: string;
  parent_id?: string | null;
  children?: GraphNode[];
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphData {
  nodes?: GraphNode[];
  edges?: GraphEdge[];
  root_nodes?: string[];
}

// Short context ID for display (first 8 chars of UUID)
function shortContextId(id: string | undefined): string {
  if (!id) return "—";
  return id.length >= 8 ? id.substring(0, 8) : id;
}

// Convert graph data to react-d3-tree format; node names show context IDs.
// Uses root_nodes (or parent_id === null) so only actual roots are roots; children come from node.children or edges.
function convertToTreeData(
  nodeById: Map<string, GraphNode>,
  rootIds: string[],
): any[] {
  function buildNode(node: GraphNode): any {
    if (!node) return null;
    return {
      name: node.id ? shortContextId(node.id) : node.label || node.url || "Context",
      attributes: {
        context_id: node.id,
        url: node.url,
        context_type: node.context_type || "text",
        tags: Array.isArray(node.tags) ? node.tags.join(", ") : "",
      },
      children: (node.children || []).map(buildNode).filter(Boolean),
    };
  }

  const roots: any[] = [];
  for (const id of rootIds) {
    const node = nodeById.get(id);
    if (node) {
      const treeNode = buildNode(node);
      if (treeNode) roots.push(treeNode);
    }
  }

  return roots;
}

function normalizeGraphData(graphData: GraphData | undefined) {
  const nodes = Array.isArray(graphData?.nodes) ? graphData?.nodes ?? [] : [];
  const edges = Array.isArray(graphData?.edges) ? graphData?.edges ?? [] : [];
  const nodeById = new Map<string, GraphNode>();

  const ensureNode = (node: GraphNode | undefined | null) => {
    if (!node?.id) return null;
    const existing = nodeById.get(node.id);
    if (existing) return existing;
    const normalized: GraphNode = {
      ...node,
      children: Array.isArray(node.children) ? [...node.children] : [],
    };
    nodeById.set(node.id, normalized);
    return normalized;
  };

  for (const node of nodes) {
    ensureNode(node);
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        ensureNode(child);
      }
    }
  }

  for (const edge of edges) {
    const parent = edge?.source ? nodeById.get(edge.source) : null;
    const child = edge?.target ? nodeById.get(edge.target) : null;
    if (parent && child) {
      if (!Array.isArray(parent.children)) parent.children = [];
      const hasChild = parent.children.some((c) => c?.id === child.id);
      if (!hasChild) parent.children.push(child);
    }
  }

  const rootIds =
    graphData?.root_nodes && graphData.root_nodes.length > 0
      ? graphData.root_nodes
      : nodes.filter((node) => node?.parent_id == null).map((node) => node.id);

  return { nodeById, rootIds };
}

function collectDescendantIds(
  rootId: string,
  nodeById: Map<string, GraphNode>,
): Set<string> {
  const ids = new Set<string>();
  const visit = (node?: GraphNode) => {
    if (!node?.id || ids.has(node.id)) return;
    ids.add(node.id);
    (node.children || []).forEach((child) => visit(child));
  };
  visit(nodeById.get(rootId));
  return ids;
}

export default function KnowledgePage() {
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRootId, setSelectedRootId] = useState<string | null>(null);

  // Fetch graph data (hierarchical nodes + edges)
  const {
    data: graphData,
    isLoading: isLoadingGraph,
    error: graphError,
  } = useQuery({
    queryKey: ["contexts-graph"],
    queryFn: async () => {
      const res = await fetch("/api/contexts/graph", {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch graph");
      return res.json();
    },
  });

  const { nodeById, rootIds } = useMemo(
    () => normalizeGraphData(graphData as GraphData),
    [graphData],
  );

  const rootNodes = useMemo(
    () =>
      rootIds
        .map((id) => nodeById.get(id))
        .filter(Boolean) as GraphNode[],
    [rootIds, nodeById],
  );

  useEffect(() => {
    if (!selectedRootId && rootIds.length > 0) {
      setSelectedRootId(rootIds[0]);
    }
  }, [rootIds, selectedRootId]);

  const highlightNodeIds = useMemo(() => {
    if (!selectedRootId) return new Set<string>();
    return collectDescendantIds(selectedRootId, nodeById);
  }, [selectedRootId, nodeById]);

  const treeData = useMemo(
    () => convertToTreeData(nodeById, rootIds),
    [nodeById, rootIds],
  );

  const handleViewDetails = async (contextId: string) => {
    try {
      const res = await fetch(`/api/contexts/${contextId}`, {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch context details");
      const data = await res.json();
      setSelectedContext(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching context details:", error);
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
            Knowledge Base
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            Explore root nodes and their related context graph
          </p>
        </div>
      </div>

      {/* Content */}
      {isLoadingGraph ? (
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
      ) : graphError ? (
        <div
          className="card"
          style={{
            padding: "var(--spacing-xl)",
            textAlign: "center",
            color: "var(--status-error)",
          }}
        >
          Error loading graph. Please try again.
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-lg)",
          }}
        >
          <div
            style={{
              flex: "0 0 320px",
              minWidth: "260px",
            }}
          >
            <div
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--spacing-md)",
                height: "600px",
                padding: "var(--spacing-lg)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--spacing-md)",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "var(--spacing-xs)",
                    }}
                  >
                    Root Nodes
                  </h2>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    Select a root to focus the graph
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "999px",
                    backgroundColor: "var(--bg-primary)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {rootNodes.length}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-sm)",
                  overflow: "auto",
                  paddingRight: "var(--spacing-xs)",
                }}
              >
                {rootNodes.length === 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "var(--spacing-xl)",
                      color: "var(--text-muted)",
                      border: "1px dashed var(--border-color)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    No root nodes available
                  </div>
                ) : (
                  rootNodes.map((node) => {
                    const isSelected = selectedRootId === node.id;
                    const contextType = node.context_type || "text";
                    const displayTitle =
                      node.label || node.url || `Context ${shortContextId(node.id)}`;
                    const timestampLabel = node.timestamp
                      ? format(new Date(node.timestamp), "MMM d, yyyy HH:mm")
                      : "—";
                    const urlLabel = (() => {
                      if (!node.url) return "";
                      try {
                        return new URL(node.url).hostname;
                      } catch {
                        return node.url;
                      }
                    })();

                    return (
                      <div
                        key={node.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedRootId(node.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedRootId(node.id);
                          }
                        }}
                        style={{
                          borderRadius: "var(--radius-md)",
                          border: `1px solid ${
                            isSelected ? "var(--accent-blue)" : "var(--border-color)"
                          }`,
                          backgroundColor: isSelected
                            ? "rgba(59, 130, 246, 0.08)"
                            : "var(--bg-primary)",
                          padding: "var(--spacing-md)",
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--spacing-xs)",
                          cursor: "pointer",
                          transition: "all var(--transition-base)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: "var(--spacing-sm)",
                            alignItems: "flex-start",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                                marginBottom: "var(--spacing-xs)",
                              }}
                            >
                              {displayTitle}
                            </p>
                            <p
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {urlLabel || shortContextId(node.id)}
                            </p>
                          </div>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              padding: "0.2rem 0.5rem",
                              borderRadius: "999px",
                              textTransform: "capitalize",
                              backgroundColor:
                                contextType === "text"
                                  ? "rgba(59, 130, 246, 0.1)"
                                  : contextType === "image"
                                    ? "rgba(34, 197, 94, 0.1)"
                                    : "rgba(249, 115, 22, 0.1)",
                              color:
                                contextType === "text"
                                  ? "var(--accent-blue)"
                                  : contextType === "image"
                                    ? "var(--accent-green)"
                                    : "var(--accent-orange)",
                            }}
                          >
                            {contextType}
                          </span>
                        </div>

                        {node.content_preview && (
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-secondary)",
                              lineHeight: 1.4,
                            }}
                          >
                            {node.content_preview.length > 120
                              ? `${node.content_preview.substring(0, 120)}...`
                              : node.content_preview}
                          </p>
                        )}

                        {Array.isArray(node.tags) && node.tags.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "var(--spacing-xs)",
                            }}
                          >
                            {node.tags.slice(0, 6).map((tag, idx) => (
                              <span
                                key={`${node.id}-tag-${idx}`}
                                style={{
                                  fontSize: "0.7rem",
                                  padding: "0.1rem 0.5rem",
                                  borderRadius: "999px",
                                  backgroundColor: "var(--bg-card)",
                                  color: "var(--text-muted)",
                                  border: "1px solid var(--border-color)",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: "0.7rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span>{timestampLabel}</span>
                          <span>{shortContextId(node.id)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{ flex: "1 1 600px", minWidth: "320px" }}>
            <KnowledgeGraph
              data={treeData}
              selectedRootId={selectedRootId || undefined}
              highlightNodeIds={highlightNodeIds}
              onNodeClick={(node) => {
                if (node.attributes?.context_id) {
                  handleViewDetails(node.attributes.context_id);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Context Details Modal – click a node/card to see raw context */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContext(null);
        }}
        title={`Context ${shortContextId(selectedContext?.context_id)}`}
        size="lg"
      >
        {selectedContext && (
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
                Context ID
              </label>
              <p
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  wordBreak: "break-all",
                }}
              >
                {selectedContext.context_id}
              </p>
            </div>
            {selectedContext.url && (
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
                  URL
                </label>
                <a
                  href={selectedContext.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--accent-blue)",
                    wordBreak: "break-all",
                  }}
                >
                  {selectedContext.url}
                </a>
              </div>
            )}
            {selectedContext.user_defined_context && (
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
                  User Context
                </label>
                <p style={{ color: "var(--text-secondary)" }}>
                  {selectedContext.user_defined_context}
                </p>
              </div>
            )}
            {selectedContext.raw_content && (
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
                  Raw context
                </label>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    whiteSpace: "pre-wrap",
                    maxHeight: "400px",
                    overflow: "auto",
                  }}
                >
                  {selectedContext.raw_content}
                </p>
              </div>
            )}
            {selectedContext.context_tags &&
              selectedContext.context_tags.length > 0 && (
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
                    Tags
                  </label>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "var(--spacing-xs)",
                    }}
                  >
                    {selectedContext.context_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          padding: "0.25rem 0.5rem",
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
                </div>
              )}
          </div>
        )}
      </Modal>
    </div>
  );
}
