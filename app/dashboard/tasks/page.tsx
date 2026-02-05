"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";

interface Task {
  task_id: string;
  task_type: string;
  input: {
    workflow_tools?: string[];
    user_context?: string;
    urls?: string[];
    selected_text?: string;
  };
  output: {
    response_tokens?: string;
    response_file?: string;
    response_image?: string;
  };
  user_contexts?: string[];
  timestamp: string;
  context_count?: number;
}

function getTaskStatus(task: Task): "completed" | "processing" | "failed" {
  if (task.output?.response_tokens || task.output?.response_file || task.output?.response_image) {
    return "completed";
  }
  // Check if there's an error in output
  if (task.output && Object.keys(task.output).length === 0) {
    return "processing";
  }
  return "processing";
}

export default function TasksPage() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: tasksData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", page, searchQuery, taskTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "50",
      });
      if (searchQuery) params.append("search", searchQuery);
      if (taskTypeFilter) params.append("task_type", taskTypeFilter);

      const res = await fetch(`/api/tasks?${params.toString()}`, {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });

  const handleViewDetails = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks?id=${taskId}&include_contexts=true`, {
        headers: getUserGuestIdHeader(),
      });
      if (!res.ok) throw new Error("Failed to fetch task details");
      const data = await res.json();
      setSelectedTask(data);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching task details:", error);
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
            Tasks
          </h1>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
            }}
          >
            View and manage your tasks
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

      {/* Filters */}
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
            placeholder="Search tasks..."
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
          value={taskTypeFilter}
          onChange={(e) => {
            setTaskTypeFilter(e.target.value);
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
          <option value="">All Task Types</option>
          <option value="add_to_context">Add to Context</option>
          <option value="create_action_from_context">Create Action</option>
          <option value="note_taking">Note Taking</option>
          <option value="add_to_knowledge_base">Add to Knowledge Base</option>
          <option value="create_todo">Create TODO</option>
        </select>
      </div>

      {/* Tasks Table */}
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
          Error loading tasks. Please try again.
        </div>
      ) : (
        <>
          <div
            className="card"
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr
                  style={{
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Task ID
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Type
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Status
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Input
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Contexts
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Created
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tasksData?.tasks?.map((task: Task) => (
                  <tr
                    key={task.task_id}
                    style={{
                      borderBottom: "1px solid var(--border-color)",
                      transition: "background-color var(--transition-base)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--bg-primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {task.task_id.substring(0, 8)}...
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {task.task_type.replace(/_/g, " ")}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                      }}
                    >
                      <StatusBadge status={getTaskStatus(task)} />
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        maxWidth: "200px",
                      }}
                    >
                      {task.input?.urls?.[0] ? (
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.input.urls[0]}
                        </span>
                      ) : task.input?.selected_text ? (
                        <span
                          style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {task.input.selected_text.substring(0, 50)}...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {task.context_count || task.user_contexts?.length || 0}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {format(new Date(task.timestamp), "MMM d, yyyy HH:mm")}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                      }}
                    >
                      <button
                        onClick={() => handleViewDetails(task.task_id)}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {tasksData && tasksData.total > 50 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--spacing-md)",
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
                Page {page} of {Math.ceil(tasksData.total / 50)}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(Math.ceil(tasksData.total / 50), p + 1))
                }
                disabled={page >= Math.ceil(tasksData.total / 50)}
                style={{
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-card)",
                  color: "var(--text-primary)",
                  cursor:
                    page >= Math.ceil(tasksData.total / 50)
                      ? "not-allowed"
                      : "pointer",
                  opacity: page >= Math.ceil(tasksData.total / 50) ? 0.5 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Task Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTask(null);
        }}
        title="Task Details"
        size="xl"
      >
        {selectedTask && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-lg)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
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
                  Task ID
                </label>
                <p style={{ color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {selectedTask.task_id}
                </p>
              </div>
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
                  Status
                </label>
                <StatusBadge status={getTaskStatus(selectedTask)} />
              </div>
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
                  Task Type
                </label>
                <p style={{ color: "var(--text-secondary)" }}>
                  {selectedTask.task_type.replace(/_/g, " ")}
                </p>
              </div>
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
                  Created
                </label>
                <p style={{ color: "var(--text-secondary)" }}>
                  {format(new Date(selectedTask.timestamp), "MMM d, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>

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
                Input
              </label>
              <div
                className="card"
                style={{
                  padding: "var(--spacing-md)",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <pre
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                  }}
                >
                  {JSON.stringify(selectedTask.input, null, 2)}
                </pre>
              </div>
            </div>

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
                Output
              </label>
              <div
                className="card"
                style={{
                  padding: "var(--spacing-md)",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <pre
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                  }}
                >
                  {JSON.stringify(selectedTask.output, null, 2)}
                </pre>
              </div>
            </div>

            {selectedTask.user_contexts && selectedTask.user_contexts.length > 0 && (
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
                  Associated Contexts ({selectedTask.user_contexts.length})
                </label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "var(--spacing-xs)",
                  }}
                >
                  {selectedTask.user_contexts.map((ctxId, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: "0.75rem",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--bg-primary)",
                        color: "var(--text-muted)",
                        border: "1px solid var(--border-color)",
                        fontFamily: "monospace",
                      }}
                    >
                      {ctxId.substring(0, 8)}...
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
