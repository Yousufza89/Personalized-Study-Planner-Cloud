import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { generateSASUrl } from "@/lib/blobSas";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const fileName = searchParams.get("fileName");
    const scheduleId = searchParams.get("scheduleId");

    if (!fileName || !scheduleId) {
      return NextResponse.json(
        { error: "fileName and scheduleId are required" },
        { status: 400 }
      );
    }

    // Generate unique blob name with user ID and schedule ID
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const blobName = `${session.user.id}/${scheduleId}/${timestamp}_${sanitizedFileName}`;

    const sasUrl = generateSASUrl(blobName, 60); // 60 minutes expiry
    const fileUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER_NAME}/${blobName}`;

    return NextResponse.json({
      sasUrl,
      fileUrl,
      blobName,
    });
  } catch (error: any) {
    console.error("Error generating SAS URL:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}

