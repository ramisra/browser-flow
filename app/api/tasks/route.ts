import { NextResponse } from "next/server";
import { getGuestIdOrGenerate } from "@/lib/user-guest-id";

interface CreateTaskPayload {
  url?: string;
  urls?: string[];
  selectedText?: string;
  userContext?: string;
}

// Base URL for your FastAPI agents backend.
// In dev this is http://localhost:8000; in production set BROWSER_FLO_BACKEND_URL (e.g. on Vercel).
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

const isLocalBackend =
  !process.env.BROWSER_FLO_BACKEND_URL ||
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(FASTAPI_BASE);

function backendUnreachableResponse(message: string) {
  return NextResponse.json(
    {
      error: message,
      hint: isLocalBackend
        ? "In production, set BROWSER_FLO_BACKEND_URL to your FastAPI backend URL (e.g. on Vercel env vars)."
        : undefined,
    },
    { status: 503 },
  );
}

export async function POST(req: Request) {
  const body = (await req.json()) as CreateTaskPayload;

  console.log("[Browser Flow API] Received request body:", JSON.stringify(body, null, 2));

  try {
    const backendPayload: {
      urls?: string[];
      selected_text?: string;
      user_context?: string;
    } = {};

    if (body.urls?.length) {
      backendPayload.urls = body.urls;
    } else if (body.url) {
      backendPayload.urls = [body.url];
    }
    if (body.selectedText) {
      backendPayload.selected_text = body.selectedText;
    }
    if (body.userContext) {
      backendPayload.user_context = body.userContext;
    }

    console.log("[Browser Flow API] Sending to FastAPI backend:", JSON.stringify(backendPayload, null, 2));

    // Use header when sent (dashboard/reloaded extension); otherwise generate one so extension still works before reload
    const guestId = getGuestIdOrGenerate(req);
    const headers = {
      "Content-Type": "application/json",
      "X-User-Guest-ID": guestId,
    };

    const resp = await fetch(`${FASTAPI_BASE}/api/tasks`, {
      method: "POST",
      headers,
      body: JSON.stringify(backendPayload),
    });

    const data = await resp.json().catch(() => ({ error: "Invalid JSON from backend" }));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    const isNetwork =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ENOTFOUND" ||
      err?.code === "ETIMEDOUT" ||
      err?.message?.includes("fetch failed");
    console.error("[Browser Flow] Error calling FastAPI backend", error);
    return backendUnreachableResponse(
      isNetwork && isLocalBackend
        ? "FastAPI backend not reachable. Set BROWSER_FLO_BACKEND_URL to your backend URL (e.g. https://your-backend.onrender.com)."
        : "Failed to reach FastAPI backend",
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  // If id is provided, get specific task details
  if (id) {
    const guestId = getGuestIdOrGenerate(req);
    try {
      const headers = {
        "Content-Type": "application/json",
        "X-User-Guest-ID": guestId,
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

      const data = await resp.json().catch(() => ({ error: "Invalid JSON from backend" }));
      return NextResponse.json(data, { status: resp.status });
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      const isNetwork =
        err?.code === "ECONNREFUSED" ||
        err?.code === "ENOTFOUND" ||
        err?.code === "ETIMEDOUT" ||
        err?.message?.includes("fetch failed");
      console.error("[Browser Flow] Error calling FastAPI backend", error);
      return backendUnreachableResponse(
        isNetwork && isLocalBackend
          ? "FastAPI backend not reachable. Set BROWSER_FLO_BACKEND_URL to your backend URL (e.g. https://your-backend.onrender.com)."
          : "Failed to reach FastAPI backend",
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

    const guestId = getGuestIdOrGenerate(req);
    const headers = {
      "Content-Type": "application/json",
      "X-User-Guest-ID": guestId,
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

    const data = await resp.json().catch(() => ({ error: "Invalid JSON from backend" }));
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    const isNetwork =
      err?.code === "ECONNREFUSED" ||
      err?.code === "ENOTFOUND" ||
      err?.code === "ETIMEDOUT" ||
      err?.message?.includes("fetch failed");
    console.error("[Browser Flow] Error calling FastAPI backend", error);
    return backendUnreachableResponse(
      isNetwork && isLocalBackend
        ? "FastAPI backend not reachable. Set BROWSER_FLO_BACKEND_URL to your backend URL (e.g. https://your-backend.onrender.com)."
        : "Failed to reach FastAPI backend",
    );
  }
}

