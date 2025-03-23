import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/lib/auth";
import { assetService } from "~/lib/services";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await getServerAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user ID from session
    const userId = parseInt(session.user.id as string, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "Invalid user session" },
        { status: 400 }
      );
    }

    // Parse form data (file and metadata)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const pageId = formData.get("pageId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get file details
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    // Read file as base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Store in database using service
    const newAsset = await assetService.create({
      fileName,
      fileType,
      fileSize,
      data: base64Data,
      uploadedById: userId,
      pageId: pageId ? parseInt(pageId, 10) : null,
    });

    // Return asset info for embedding in markdown
    return NextResponse.json({
      success: true,
      asset: {
        id: newAsset.id,
        fileName: newAsset.fileName,
        fileType: newAsset.fileType,
        url: `/api/assets/${newAsset.id}`,
      },
    });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json(
      { error: "Failed to upload asset" },
      { status: 500 }
    );
  }
}
