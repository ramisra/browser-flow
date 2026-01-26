import { NextResponse } from "next/server";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";

type TaskType = "add_to_context" | "create_action_from_context";

interface CreateTaskPayload {
  url?: string;
  selectedText?: string;
  taskType: TaskType;
  userContext?: string;
  metadata?: Record<string, unknown>;
}

// Base URL for your FastAPI agents backend.
// In dev this is http://localhost:8000; you can override via env in production.
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: Request) {
  const body = (await req.json()) as CreateTaskPayload;

  console.log("[Browser Flow API] Received request body:", JSON.stringify(body, null, 2));

  if (!body.taskType) {
    return NextResponse.json(
      { error: "Missing taskType" },
      { status: 400 },
    );
  }

  if (!body.url && !body.selectedText) {
    return NextResponse.json(
      { error: "Missing url or selectedText" },
      { status: 400 },
    );
  }

  try {
    const backendPayload: {
      task_type: TaskType;
      urls?: string[];
      selected_text?: string;
      user_context?: string;
      metadata: Record<string, unknown>;
    } = {
      task_type: body.taskType,
      metadata: body.metadata ?? {},
    };

    // If selectedText is present, only send selectedText (don't send URL)
    // If only URL is present (no selectedText), send URL
    if (body.selectedText) {
      backendPayload.selected_text = body.selectedText;
      // Explicitly don't include URL when selectedText is present
    } else if (body.url) {
      backendPayload.urls = [body.url];
    }

    // Include user context if provided
    if (body.userContext) {
      backendPayload.user_context = body.userContext;
    }

    console.log("[Browser Flow API] Sending to FastAPI backend:", JSON.stringify(backendPayload, null, 2));

    const headers = {
      "Content-Type": "application/json",
      ...getUserGuestIdHeader(),
    };

    const resp = await fetch(`${FASTAPI_BASE}/api/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(backendPayload),
    });

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error("[Browser Flow] Error calling FastAPI backend", error);
    return NextResponse.json(
      { error: "Failed to reach FastAPI backend" },
      { status: 502 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // If id is provided, get specific task details
  if (id) {
    try {
      const headers = {
        "Content-Type": "application/json",
        ...getUserGuestIdHeader(),
      };

      const includeContexts = searchParams.get("include_contexts");
      const url = `${FASTAPI_BASE}/api/tasks/${encodeURIComponent(id)}${
        includeContexts ? "?include_contexts=true" : ""
      }`;

      const resp = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        return NextResponse.json(
          { error: errorData.detail || "Failed to fetch task" },
          { status: resp.status },
        );
      }

      const data = await resp.json();
      return NextResponse.json(data, { status: resp.status });
    } catch (error) {
      console.error("[Browser Flow] Error calling FastAPI backend", error);
      return NextResponse.json(
        { error: "Failed to reach FastAPI backend" },
        { status: 502 },
      );
    }
  }

  // Otherwise, get list of tasks
  try {
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "50";
    const taskType = searchParams.get("task_type");
    const search = searchParams.get("search");

    const queryParams = new URLSearchParams({
      page,
      page_size: pageSize,
    });

    if (taskType) {
      queryParams.append("task_type", taskType);
    }
    if (search) {
      queryParams.append("search", search);
    }

    const headers = {
      "Content-Type": "application/json",
      ...getUserGuestIdHeader(),
    };

    const resp = await fetch(
      `${FASTAPI_BASE}/api/tasks?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch tasks" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error("[Browser Flow] Error calling FastAPI backend", error);
    return NextResponse.json(
      { error: "Failed to reach FastAPI backend" },
      { status: 502 },
    );
  }
}

