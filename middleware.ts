import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS for /api so the browser extension (chrome-extension:// or moz-extension://)
 * and the dashboard can call the API when deployed.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/")) return NextResponse.next();

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Guest-ID",
    "Access-Control-Max-Age": "86400",
  };

  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  const res = NextResponse.next();
  Object.entries(corsHeaders).forEach(([key, value]) =>
    res.headers.set(key, value)
  );
  return res;
}

export const config = {
  matcher: "/api/:path*",
};
