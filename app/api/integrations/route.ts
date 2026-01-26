import { NextResponse } from "next/server";

// Mock integrations data
// In the future, this could be replaced with actual FastAPI endpoint
const MOCK_INTEGRATIONS = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    icon: "📊",
    enabled: false,
    usageCount: 0,
    description: "Export data to Google Sheets",
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    enabled: true,
    usageCount: 12,
    description: "Sync notes and pages to Notion",
  },
  {
    id: "excel",
    name: "Excel",
    icon: "📈",
    enabled: false,
    usageCount: 0,
    description: "Export to Excel format",
  },
  {
    id: "trello",
    name: "Trello",
    icon: "📋",
    enabled: true,
    usageCount: 8,
    description: "Create cards and boards in Trello",
  },
  {
    id: "airflow",
    name: "Airflow",
    icon: "⚙️",
    enabled: false,
    usageCount: 0,
    description: "Schedule and automate workflows",
  },
  {
    id: "miro",
    name: "Miro",
    icon: "🎨",
    enabled: false,
    usageCount: 0,
    description: "Create diagrams and visualizations",
  },
];

export async function GET(req: Request) {
  // In the future, this could fetch from FastAPI
  // For now, return mock data
  return NextResponse.json({
    integrations: MOCK_INTEGRATIONS,
    total: MOCK_INTEGRATIONS.length,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, integrationId } = body;

  if (action === "toggle" && integrationId) {
    // In a real implementation, this would call FastAPI
    // For now, return success
    return NextResponse.json({
      success: true,
      message: "Integration toggled",
    });
  }

  return NextResponse.json(
    { error: "Invalid action" },
    { status: 400 },
  );
}
