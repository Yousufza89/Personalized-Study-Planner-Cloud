import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContainer } from "@/lib/cosmosClient";
import { Schedule } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Cosmos DB is configured
    if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
      // Return empty array in demo mode
      console.warn("Cosmos DB not configured - returning empty schedules (demo mode)");
      return NextResponse.json([]);
    }

    const container = await getContainer();
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: session.user.id }],
      })
      .fetchAll();

    return NextResponse.json(resources);
  } catch (error: any) {
    console.error("Error fetching schedules:", error);
    // In demo mode, return empty array instead of error
    if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
      return NextResponse.json([]);
    }
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: Schedule = await request.json();
    const schedule: Schedule = {
      ...body,
      userId: session.user.id,
      id: `schedule_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resources: body.resources || [],
    };

    // Check if Cosmos DB is configured
    if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
      // Return mock data in demo mode
      console.warn("Cosmos DB not configured - returning mock schedule (demo mode)");
      return NextResponse.json(schedule, { status: 201 });
    }

    const container = await getContainer();
    const { resource } = await container.items.create(schedule);

    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    console.error("Error creating schedule:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}

