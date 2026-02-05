import { NextResponse } from "next/server";
import { getUserGuestIdFromRequest } from "@/lib/user-guest-id";

// Base URL for your FastAPI agents backend.
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: Request) {
  const guestId = getUserGuestIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json(
      { error: "X-User-Guest-ID header is required" },
      { status: 400 },
    );
  }

  try {
    const resp = await fetch(`${FASTAPI_BASE}/api/integrations/tokens`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-User-Guest-ID": guestId,
      },
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch integration tokens" },
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

export async function POST(req: Request) {
  const guestId = getUserGuestIdFromRequest(req);
  if (!guestId) {
    return NextResponse.json(
      { error: "X-User-Guest-ID header is required" },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => ({}));

  try {
    const resp = await fetch(`${FASTAPI_BASE}/api/integrations/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Guest-ID": guestId,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to enable integration" },
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
