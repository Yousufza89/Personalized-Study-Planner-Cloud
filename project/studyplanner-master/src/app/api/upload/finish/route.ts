import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContainer } from "@/lib/cosmosClient";
import { Resource } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { scheduleId, fileName, fileSize, fileType, fileUrl } = body;

    if (!scheduleId || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const container = await getContainer();
    // Query to find schedule by id (partition key is userId)
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: scheduleId }],
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

    const newResource: Resource = {
      id: `resource_${Date.now()}`,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      fileType: fileType || "application/octet-stream",
      uploadedAt: new Date().toISOString(),
    };

    const updatedResources = [...(schedule.resources || []), newResource];

    const updatedSchedule = {
      ...schedule,
      resources: updatedResources,
      updatedAt: new Date().toISOString(),
    };

    const { resource } = await container.items.upsert(updatedSchedule);

    return NextResponse.json({ success: true, resource: newResource });
  } catch (error: any) {
    console.error("Error saving resource metadata:", error);
    return NextResponse.json(
      { error: "Failed to save resource metadata" },
      { status: 500 }
    );
  }
}

