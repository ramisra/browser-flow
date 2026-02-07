import { NextResponse } from "next/server";
import { getGuestIdOrGenerate } from "@/lib/user-guest-id";

const FASTAPI_BASE =
  process.env.BROWSER_FLO_BACKEND_URL ?? "http://localhost:8000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path || typeof path !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid path parameter" },
      { status: 400 }
    );
  }

  // Normalize: allow "app/storage/excel/foo.xlsx" or bare "foo.xlsx"; block path traversal
  const normalized = path.replace(/^\/+/, "").replace(/\.\./g, "");
  const isFullPath = normalized.startsWith("app/storage/excel/") && normalized.endsWith(".xlsx");
  const isBareFilename = !normalized.includes("/") && normalized.endsWith(".xlsx");
  if (!isFullPath && !isBareFilename) {
    return NextResponse.json(
      { error: "Invalid file path" },
      { status: 400 }
    );
  }

  const filename = normalized.split("/").pop() ?? "download.xlsx";
  const guestId = getGuestIdOrGenerate(req);

  try {
    const backendUrl = `${FASTAPI_BASE}/api/files/excel/${encodeURIComponent(filename)}`;
    const resp = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "X-User-Guest-ID": guestId,
      },
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json(
        { error: text || "Failed to fetch file" },
        { status: resp.status }
      );
    }

    const blob = await resp.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("[Browser Flow] Error proxying task file download", error);
    return NextResponse.json(
      { error: "Failed to reach backend for file download" },
      { status: 502 }
    );
  }
}
