import { NextResponse } from "next/server";
import { getUserGuestIdHeader } from "@/lib/user-guest-id";

// Base URL for your FastAPI agents backend.
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  // Build query parameters
  const page = searchParams.get("page") || "1";
  const pageSize = searchParams.get("page_size") || "50";
  const contextType = searchParams.get("context_type");
  const tags = searchParams.get("tags");
  const search = searchParams.get("search");

  // Build query string
  const queryParams = new URLSearchParams({
    page,
    page_size: pageSize,
  });

  if (contextType) {
    queryParams.append("context_type", contextType);
  }
  if (tags) {
    queryParams.append("tags", tags);
  }
  if (search) {
    queryParams.append("search", search);
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      ...getUserGuestIdHeader(),
    };

    const resp = await fetch(
      `${FASTAPI_BASE}/api/contexts?${queryParams.toString()}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch contexts" },
        { status: resp.status },
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (error) {
    console.error("[Browser Flo] Error calling FastAPI backend", error);
    return NextResponse.json(
      { error: "Failed to reach FastAPI backend" },
      { status: 502 },
    );
  }
}
