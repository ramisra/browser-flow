"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Eye, RefreshCw, Download } from "lucide-react";
import { format } from "date-fns";
import StatusBadge from "@/components/StatusBadge";
import LoadingSpinner from "@/components/LoadingSpinner";
import Modal from "@/components/Modal";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";

interface ProcessedContextItem {
  title?: string;
  url?: string;
  content?: string;
  tags?: string[];
  short_summary?: string;
  [key: string]: unknown;
}

interface ContextInput {
  urls?: string[] | null;
  user_task?: string;
  selected_text?: string;
  processed_context?: {
    contexts?: ProcessedContextItem[];
  };
  [key: string]: unknown;
}

interface Task {
  task_id: string;
  task_type: string;
  input: {
    context_input?: ContextInput;
    workflow_tools?: string[];
    user_context?: string;
    user_task?: string;
    urls?: string[];
    selected_text?: string;
    process_contexts?: ProcessedContextItem[];
    [key: string]: unknown;
  };
  output: {
    status?: string;
    result?: { status?: string; [key: string]: unknown };
    response_tokens?: string;
    response_file?: string;
    response_image?: string;
    [key: string]: unknown;
  };
  user_contexts?: string[];
  timestamp: string;
  context_count?: number;
}

/** Title from input: context_input.processed_context.contexts[0].title */
function getTaskTitle(task: Task): string | null {
  const ctx = task.input?.context_input?.processed_context?.contexts?.[0];
  if (ctx && typeof ctx.title === "string") return ctx.title;
  const legacy = task.input?.process_contexts?.[0];
  return (legacy && typeof legacy.title === "string") ? legacy.title : null;
}

/** user_task from context_input or legacy input */
function getUserTask(task: Task): string {
  return (
    task.input?.context_input?.user_task ??
    task.input?.user_task ??
    task.input?.user_context ??
    ""
  );
}

/** selected_text from context_input or legacy input */
function getSelectedText(task: Task): string {
  return task.input?.context_input?.selected_text ?? task.input?.selected_text ?? "";
}

/** Input summary for list: { user_task, selected_text } as JSON (truncated) */
function getInputSummary(task: Task): string {
  const userTask = getUserTask(task);
  const selectedText = getSelectedText(task);
  const obj = { user_task: userTask || undefined, selected_text: selectedText || undefined };
  const json = JSON.stringify(obj);
  if (json.length <= 60) return json;
  return json.slice(0, 57) + "...";
}

/** Input for detail view: { user_task, selected_text } only, as formatted JSON */
function getInputDetailJson(task: Task): string {
  const userTask = getUserTask(task);
  const selectedText = getSelectedText(task);
  return JSON.stringify(
    { user_task: userTask || undefined, selected_text: selectedText || undefined },
    null,
    2
  );
}

function getTaskStatus(task: Task): "completed" | "processing" | "failed" {
  const out = task.output;
  if (!out) return "processing";
  if (out.status === "completed" || out.result?.status === "completed") return "completed";
  if (out.response_tokens || out.response_file || out.response_image) return "completed";
  if (Object.keys(out).length === 0) return "processing";
  return "processing";
}

/** Excel file path from output (extract-data-to-sheet type), from result or agent_results */
function getExcelFilePath(task: Task): string | null {
  const out = task.output;
  if (!out) return null;
  const fromTop =
    typeof (out as { excel_file_path?: string }).excel_file_path === "string"
      ? (out as { excel_file_path: string }).excel_file_path
      : null;
  if (fromTop) return fromTop;
  const fromResult =
    typeof (out.result as { excel_file_path?: string } | undefined)?.excel_file_path === "string"
      ? (out.result as { excel_file_path: string }).excel_file_path
      : null;
  if (fromResult) return fromResult;
  const agents = out.agent_results as Array<{ excel_file_path?: string }> | undefined;
  const first = agents?.[0]?.excel_file_path;
  return typeof first === "string" ? first : null;
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

  const handleDownloadExcel = async (path: string) => {
    try {
      const res = await fetch(
        `/api/tasks/download?path=${encodeURIComponent(path)}`,
        { headers: getUserGuestIdHeader() }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Download failed");
      }
      const blob = await res.blob();
      const filename = path.split("/").pop() ?? "extract.xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(error instanceof Error ? error.message : "Download failed");
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
              fontSize: "clamp(1.5rem, 4vw, 2rem)",
              fontWeight: 700,
              color: "#fff",
              marginBottom: "var(--spacing-xs)",
              letterSpacing: "-0.02em",
            }}
          >
            Tasks
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--landing-text-muted)",
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
            borderRadius: "999px",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            backgroundColor: "var(--landing-bg-card)",
            color: "var(--landing-text)",
            cursor: "pointer",
            fontSize: "0.875rem",
            transition: "all var(--transition-base)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "var(--landing-bg-card)";
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div
        className="card-landing"
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
              border: "1px solid rgba(148, 163, 184, 0.2)",
              backgroundColor: "var(--landing-bg)",
              color: "var(--landing-text)",
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
            border: "1px solid rgba(148, 163, 184, 0.2)",
            backgroundColor: "var(--landing-bg)",
            color: "var(--landing-text)",
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
          className="card-landing"
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
            className="card-landing"
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
                    borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
                  }}
                >
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      padding: "var(--spacing-md)",
                      textAlign: "left",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
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
                      color: "var(--landing-text-muted)",
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
                      borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                      transition: "background-color var(--transition-base)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--landing-text-muted)",
                      }}
                    >
                      {task.task_id.substring(0, 8)}...
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--landing-text)",
                      }}
                    >
                      {task.task_type.replace(/_/g, " ")}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--landing-text)",
                        maxWidth: "200px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={getTaskTitle(task) ?? undefined}
                      >
                        {getTaskTitle(task) ?? "—"}
                      </span>
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
                        color: "var(--landing-text-muted)",
                        maxWidth: "240px",
                      }}
                    >
                      <span
                        style={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          fontFamily: "var(--font-mono)",
                        }}
                        title={getInputSummary(task)}
                      >
                        {getInputSummary(task)}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--landing-text-muted)",
                      }}
                    >
                      {task.context_count || task.user_contexts?.length || 0}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                        fontSize: "0.875rem",
                        color: "var(--landing-text-muted)",
                      }}
                    >
                      {format(new Date(task.timestamp), "MMM d, yyyy HH:mm")}
                    </td>
                    <td
                      style={{
                        padding: "var(--spacing-md)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "var(--spacing-xs)",
                        }}
                      >
                        <button
                          onClick={() => handleViewDetails(task.task_id)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "var(--spacing-xs)",
                            padding: "0.375rem 0.75rem",
                            borderRadius: "999px",
                            border: "1px solid rgba(148, 163, 184, 0.2)",
                            backgroundColor: "transparent",
                            color: "var(--landing-text-muted)",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                            transition: "all var(--transition-base)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "var(--landing-accent-glow)";
                            e.currentTarget.style.color = "var(--landing-text)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = "var(--landing-text-muted)";
                          }}
                        >
                          <Eye size={14} />
                          View
                        </button>
                        {getExcelFilePath(task) && (
                          <button
                            onClick={() => handleDownloadExcel(getExcelFilePath(task)!)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "var(--spacing-xs)",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "999px",
                              border: "1px solid rgba(148, 163, 184, 0.2)",
                              backgroundColor: "transparent",
                              color: "var(--landing-text-muted)",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                              transition: "all var(--transition-base)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "var(--landing-accent-glow)";
                              e.currentTarget.style.color = "var(--landing-text)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "var(--landing-text-muted)";
                            }}
                          >
                            <Download size={14} />
                            Download
                          </button>
                        )}
                      </div>
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
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  backgroundColor: "var(--landing-bg-card)",
                  color: "var(--landing-text)",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                  opacity: page === 1 ? 0.5 : 1,
                }}
              >
                Previous
              </button>
              <span
                style={{
                  color: "var(--landing-text-muted)",
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
                  borderRadius: "999px",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  backgroundColor: "var(--landing-bg-card)",
                  color: "var(--landing-text)",
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
            {/* Title from input context -> process_contexts[0].title (same for completed) */}
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--landing-text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "var(--spacing-xs)",
                  display: "block",
                }}
              >
                Title
              </label>
              <p style={{ color: "var(--landing-text)", fontSize: "1rem", fontWeight: 500 }}>
                {getTaskTitle(selectedTask) ?? "—"}
              </p>
            </div>

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
                    color: "var(--landing-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  Task ID
                </label>
                <p style={{ color: "var(--landing-text)", fontFamily: "var(--font-mono)" }}>
                  {selectedTask.task_id}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--landing-text-muted)",
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
                    color: "var(--landing-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  Task Type
                </label>
                <p style={{ color: "var(--landing-text)" }}>
                  {selectedTask.task_type.replace(/_/g, " ")}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--landing-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  Created
                </label>
                <p style={{ color: "var(--landing-text)" }}>
                  {format(new Date(selectedTask.timestamp), "MMM d, yyyy HH:mm:ss")}
                </p>
              </div>
            </div>

            {/* Input: user_task and selected_text in JSON form (same for completed) */}
            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--landing-text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "var(--spacing-xs)",
                  display: "block",
                }}
              >
                Input (user_task, selected_text)
              </label>
              <div
                className="card-landing"
                style={{
                  padding: "var(--spacing-md)",
                  backgroundColor: "var(--landing-bg)",
                }}
              >
                <pre
                  style={{
                    color: "var(--landing-text)",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    margin: 0,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {getInputDetailJson(selectedTask)}
                </pre>
              </div>
            </div>

            {getExcelFilePath(selectedTask) && (
              <div>
                <label
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--landing-text-muted)",
                    textTransform: "uppercase",
                    marginBottom: "var(--spacing-xs)",
                    display: "block",
                  }}
                >
                  Extract to sheet
                </label>
                <button
                  onClick={() => handleDownloadExcel(getExcelFilePath(selectedTask)!)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "var(--spacing-sm)",
                    padding: "var(--spacing-sm) var(--spacing-md)",
                    borderRadius: "999px",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    backgroundColor: "var(--landing-accent-glow)",
                    color: "var(--landing-text)",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "all var(--transition-base)",
                  }}
                >
                  <Download size={18} />
                  Download Excel
                </button>
              </div>
            )}

            <div>
              <label
                style={{
                  fontSize: "0.75rem",
                  color: "var(--landing-text-muted)",
                  textTransform: "uppercase",
                  marginBottom: "var(--spacing-xs)",
                  display: "block",
                }}
              >
                Output
              </label>
              <div
                className="card-landing"
                style={{
                  padding: "var(--spacing-md)",
                  backgroundColor: "var(--landing-bg)",
                }}
              >
                <pre
                  style={{
                    color: "var(--landing-text)",
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
                    color: "var(--landing-text-muted)",
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
                        backgroundColor: "var(--landing-bg)",
                        color: "var(--landing-text-muted)",
                        border: "1px solid rgba(148, 163, 184, 0.2)",
                        fontFamily: "var(--font-mono)",
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
