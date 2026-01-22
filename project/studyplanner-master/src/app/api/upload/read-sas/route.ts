import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getContainer } from "@/lib/cosmosClient";
import { generateSASUrl } from "@/lib/blobSas";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fileUrl = searchParams.get("fileUrl");
    const scheduleId = searchParams.get("scheduleId");

    if (!fileUrl || !scheduleId) {
      return NextResponse.json({ error: "fileUrl and scheduleId are required" }, { status: 400 });
    }

    const container = await getContainer();

    // Find schedule by id
    const { resources } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.id = @id",
        parameters: [{ name: "@id", value: scheduleId }],
      })
      .fetchAll();

    if (resources.length === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
    }

    const schedule = resources[0];

    if (schedule.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the resource inside schedule
    const resource = (schedule.resources || []).find((r: any) => r.fileUrl === fileUrl);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Derive blobName from fileUrl
    // fileUrl format: https://{account}.blob.core.windows.net/{container}/{blobName}
    const prefix = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/`;
    if (!fileUrl.startsWith(prefix)) {
      return NextResponse.json({ error: "Invalid fileUrl" }, { status: 400 });
    }

    const blobName = decodeURIComponent(fileUrl.substring(prefix.length));

    // Generate read-only SAS valid for a short time (e.g., 10 minutes)
    const sasUrl = generateSASUrl(blobName, 10, "r");

    return NextResponse.json({ sasUrl });
  } catch (error: any) {
    console.error("Error generating read SAS:", error);
    return NextResponse.json({ error: "Failed to generate read SAS" }, { status: 500 });
  }
}
