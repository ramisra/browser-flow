import { NextResponse } from "next/server";
import { getUserGuestIdFromRequest } from "@/lib/user-guest-id";

// Base URL for your FastAPI agents backend.
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const { searchParams } = new URL(req.url);
  const includeContexts = searchParams.get("include_contexts");

  const contextId = params.id;

  if (!contextId) {
    return NextResponse.json(
      { error: "Missing context ID" },
      { status: 400 },
    );
  }

  const guestId = getUserGuestIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json(
      { error: "X-User-Guest-ID header is required" },
      { status: 400 },
    );
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "X-User-Guest-ID": guestId,
    };

    const url = `${FASTAPI_BASE}/api/contexts/${encodeURIComponent(contextId)}${
      includeContexts ? "?include_contexts=true" : ""
    }`;

    const resp = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch context details" },
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
