import { NextResponse } from "next/server";
import { getUserGuestId } from "@/lib/user-guest-id";

// Mock profile data
// In the future, this could fetch from FastAPI or derive from tasks/contexts
export async function GET(req: Request) {
  const userGuestId = getUserGuestId();

  // Mock profile data
  // In production, this could be derived from tasks/contexts endpoints
  const profile = {
    userGuestId,
    displayName: "User",
    accountCreated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    lastActivity: new Date().toISOString(),
    subscription: {
      plan: "Free",
      billingCycle: null,
      usage: {
        totalTasks: 0, // Would be fetched from /api/tasks
        totalContexts: 0, // Would be fetched from /api/contexts
        activeIntegrations: 0, // Would be fetched from /api/integrations
      },
    },
  };

  return NextResponse.json(profile);
}
