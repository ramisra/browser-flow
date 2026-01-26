"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { List, Network, Search, Filter } from "lucide-react";
import KnowledgeList from "@/components/KnowledgeList";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";

type ViewMode = "list" | "graph";

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

// Convert graph data to react-d3-tree format
function convertToTreeData(graphData: any): any[] {
  if (!graphData?.nodes || graphData.nodes.length === 0) {
    return [];
  }

  function buildNode(node: any): any {
    return {
      name: node.label || node.url || "Context",
      attributes: {
        context_id: node.id,
        url: node.url,
        context_type: node.context_type || "text",
        tags: node.tags?.join(", ") || "",
      },
      children: node.children?.map(buildNode) || [],
    };
  }

  return graphData.nodes.map(buildNode);
}

export default function KnowledgePage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextTypeFilter, setContextTypeFilter] = useState<string>("");
  const [tagsFilter, setTagsFilter] = useState("");
  const [selectedContext, setSelectedContext] = useState<Context | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch contexts list
  const {
    data: contextsData,
    isLoading: isLoadingList,
    error: listError,
  } = useQuery({
    queryKey: ["contexts", page, searchQuery, contextTypeFilter, tagsFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (contextTypeFilter) params.append("context_type", contextTypeFilter);
      if (tagsFilter) params.append("tags", tagsFilter);

      const res = await fetch(`/api/contexts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch contexts");
      return res.json();
    },
  });

  // Fetch graph data
  const {
    data: graphData,
    isLoading: isLoadingGraph,
    error: graphError,
  } = useQuery({
    queryKey: ["contexts-graph"],
    queryFn: async () => {
      const res = await fetch("/api/contexts/graph");
      if (!res.ok) throw new Error("Failed to fetch graph");
      return res.json();
    },
    enabled: viewMode === "graph",
  });

  const handleViewDetails = async (contextId: string) => {
    try {
      const res = await fetch(`/api/contexts/${contextId}`);
      if (!res.ok) throw new Error("Failed to fetch context details");
      const data = await res.json();
      setSelectedContext(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching context details:", error);
    }
  };

  const handleDelete = (contextId: string) => {
    if (confirm("Are you sure you want to delete this context?")) {
      // TODO: Implement delete functionality
      console.log("Delete context:", contextId);
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
            Manage your saved contexts and view relationships
          </p>
        </div>

        {/* View Toggle */}
        <div
          style={{
            display: "flex",
            gap: "var(--spacing-sm)",
            backgroundColor: "var(--bg-card)",
            padding: "0.25rem",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => setViewMode("list")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor:
                viewMode === "list" ? "var(--accent-blue)" : "transparent",
              color:
                viewMode === "list" ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: viewMode === "list" ? 600 : 400,
              transition: "all var(--transition-base)",
            }}
          >
            <List size={16} />
            List
          </button>
          <button
            onClick={() => setViewMode("graph")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-xs)",
              padding: "0.5rem 1rem",
              borderRadius: "var(--radius-sm)",
              border: "none",
              backgroundColor:
                viewMode === "graph" ? "var(--accent-blue)" : "transparent",
              color:
                viewMode === "graph" ? "white" : "var(--text-secondary)",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: viewMode === "graph" ? 600 : 400,
              transition: "all var(--transition-base)",
            }}
          >
            <Network size={16} />
            Graph
          </button>
        </div>
      </div>

      {/* Filters */}
      {viewMode === "list" && (
        <div
          className="card"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--spacing-md)",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: 1,
              minWidth: "200px",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "var(--spacing-md)",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search contexts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              style={{
                width: "100%",
                padding: "var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <select
            value={contextTypeFilter}
            onChange={(e) => {
              setContextTypeFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">All Types</option>
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          <input
            type="text"
            placeholder="Filter by tags..."
            value={tagsFilter}
            onChange={(e) => {
              setTagsFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "var(--spacing-sm) var(--spacing-md)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              backgroundColor: "var(--bg-primary)",
              color: "var(--text-primary)",
              minWidth: "150px",
            }}
          />
        </div>
      )}

      {/* Content */}
      {viewMode === "list" ? (
        <>
          {isLoadingList ? (
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
          ) : listError ? (
            <div
              className="card"
              style={{
                padding: "var(--spacing-xl)",
                textAlign: "center",
                color: "var(--status-error)",
              }}
            >
              Error loading contexts. Please try again.
            </div>
          ) : (
            <>
              <KnowledgeList
                contexts={contextsData?.contexts || []}
                onViewDetails={handleViewDetails}
                onDelete={handleDelete}
              />
              {/* Pagination */}
              {contextsData && contextsData.total > 50 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "var(--spacing-md)",
                    marginTop: "var(--spacing-lg)",
                  }}
                >
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    Previous
                  </button>
                  <span
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "0.875rem",
                    }}
                  >
                    Page {page} of {Math.ceil(contextsData.total / 50)}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(
                          Math.ceil(contextsData.total / 50),
                          p + 1,
                        ),
                      )
                    }
                    disabled={page >= Math.ceil(contextsData.total / 50)}
                    style={{
                      padding: "var(--spacing-sm) var(--spacing-md)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                      cursor:
                        page >= Math.ceil(contextsData.total / 50)
                          ? "not-allowed"
                          : "pointer",
                      opacity:
                        page >= Math.ceil(contextsData.total / 50) ? 0.5 : 1,
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
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
            <KnowledgeGraph
              data={convertToTreeData(graphData)}
              onNodeClick={(node) => {
                if (node.attributes?.context_id) {
                  handleViewDetails(node.attributes.context_id);
                }
              }}
            />
          )}
        </>
      )}

      {/* Context Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContext(null);
        }}
        title="Context Details"
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
                  Content
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
