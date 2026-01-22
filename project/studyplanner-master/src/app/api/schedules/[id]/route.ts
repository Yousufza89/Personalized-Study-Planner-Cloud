import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContainer } from "@/lib/cosmosClient";
import { Schedule } from "@/lib/types";

export async function GET(
  request: NextRequest,
  context: any
) {
  // `params` may be a Promise in some Next.js runtimes; await to unwrap.
  const rawParams = context?.params;
  const { id } = rawParams ? (await rawParams) : { id: undefined };
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Cosmos DB is configured
    if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
      return NextResponse.json(
        { error: "Schedule not found (demo mode - Cosmos DB not configured)" },
        { status: 404 }
      );
    }

    const container = await getContainer();
    // Query to find schedule by id
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const schedule = resources[0];

    if (schedule.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(schedule);
  } catch (error: any) {
    console.error("Error fetching schedule:", error);
    if (error.code === 404) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: any
) {
  const rawParams = context?.params;
  const { id } = rawParams ? (await rawParams) : { id: undefined };
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const container = await getContainer();
    // First, we need to find the schedule to get the userId (partition key)
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    
    const existingSchedule = resources[0];

    if (existingSchedule.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body: Schedule = await request.json();
    const updatedSchedule: Schedule = {
      ...existingSchedule,
      ...body,
      id: id,
      userId: session.user.id,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.items.upsert(updatedSchedule);

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error("Error updating schedule:", error);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  const rawParams = context?.params;
  const { id } = rawParams ? (await rawParams) : { id: undefined };
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const container = await getContainer();
    // First, we need to find the schedule to get the userId (partition key)
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: id }],
      })
      .fetchAll();
    
    if (resources.length === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }
    
    const existingSchedule = resources[0];

    if (existingSchedule.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await container.item(id, existingSchedule.userId).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}

