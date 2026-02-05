import { NextResponse } from "next/server";

// Base URL for your FastAPI agents backend.
const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function GET() {
  try {
    const resp = await fetch(`${FASTAPI_BASE}/api/integrations/capabilities`, {
      method: "GET",
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to fetch integration capabilities" },
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
