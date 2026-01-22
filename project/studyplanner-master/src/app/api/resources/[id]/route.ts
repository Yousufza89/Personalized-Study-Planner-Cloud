import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContainer } from "@/lib/cosmosClient";
import { getBlobServiceClient } from "@/lib/blobSas";

export async function DELETE(request: NextRequest, context: { params?: any }) {
  try {
    // Support both sync params and a Promise-like params (some Next build-time types use Promise<{id}>)
    const rawParams = context?.params;
    const params = rawParams && typeof (rawParams as any).then === "function"
      ? await rawParams
      : rawParams;

    console.log(
      "DELETE /api/resources/:id called, params=",
      params,
      "nextUrl=",
      request.nextUrl?.pathname || request.url
    );

    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try params first, then fallback to parsing from URL
    let resourceId = params?.id;
    if (!resourceId) {
      try {
        const parts = (request.nextUrl?.pathname || request.url).split("/");
        resourceId = parts[parts.length - 1] || parts[parts.length - 2];
      } catch (e) {
        // ignore
      }
    }
    if (!resourceId) {
      console.error("DELETE /api/resources - missing resourceId", {
        params,
        pathname: request.nextUrl?.pathname,
        url: request.url,
      });
      return NextResponse.json(
        {
          error: "Resource id is required",
          received: { params, pathname: request.nextUrl?.pathname, url: request.url },
        },
        { status: 400 }
      );
    }

    // If Cosmos is not configured, return not found (demo mode)
    if (!process.env.AZURE_COSMOS_ENDPOINT || !process.env.AZURE_COSMOS_KEY) {
      console.warn("Cosmos DB not configured - cannot delete resource in demo mode");
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const container = await getContainer();

    // Fetch schedules for the user and find which one contains the resource
    const { resources: schedules } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [{ name: "@userId", value: session.user.id }],
      })
      .fetchAll();

    let foundSchedule: any | null = null;
    let foundResource: any | null = null;

    for (const sched of schedules) {
      if (Array.isArray(sched.resources)) {
        const r = sched.resources.find((x: any) => x.id === resourceId);
        if (r) {
          foundSchedule = sched;
          foundResource = r;
          break;
        }
      }
    }

    if (!foundSchedule || !foundResource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Remove resource from schedule
    const updatedResources = (foundSchedule.resources || []).filter((x: any) => x.id !== resourceId);
    const updatedSchedule = {
      ...foundSchedule,
      resources: updatedResources,
      updatedAt: new Date().toISOString(),
    };

    // Try to delete blob from storage if configured and fileUrl exists
    try {
      if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_STORAGE_ACCOUNT_KEY && foundResource.fileUrl) {
        const prefix = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/`;
        if (foundResource.fileUrl.startsWith(prefix)) {
          const blobName = decodeURIComponent(foundResource.fileUrl.substring(prefix.length));
          const blobServiceClient = getBlobServiceClient();
          const containerClient = blobServiceClient.getContainerClient(process.env.AZURE_STORAGE_CONTAINER_NAME || "study-resources");
          const blockBlobClient = containerClient.getBlockBlobClient(blobName);
          await blockBlobClient.deleteIfExists();
        }
      }
    } catch (err) {
      console.error("Error deleting blob from storage:", err);
      // Continue - don't fail deletion of metadata if blob deletion fails
    }

    // Upsert updated schedule
    await container.items.upsert(updatedSchedule);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting resource:", error);
    // Return the error message in JSON to aid debugging (safe for dev)
    const message = error?.message || String(error) || "Failed to delete resource";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
