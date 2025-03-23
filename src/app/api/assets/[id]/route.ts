import { NextResponse } from "next/server";
import { assetService } from "~/lib/services";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  void resolvedParams;
  try {
    const id = parseInt(resolvedParams.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid asset ID" }, { status: 400 });
    }

    // Get asset from database using service
    const asset = await assetService.getById(id);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Decode base64 data
    const buffer = Buffer.from(asset.data, "base64");

    // Create response with appropriate Content-Type
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": asset.fileType,
        "Content-Disposition": `inline; filename="${asset.fileName}"`,
        "Cache-Control": "public, max-age=31536000", // Cache for 1 year
      },
    });
  } catch (error) {
    console.error("Error retrieving asset:", error);
    return NextResponse.json(
      { error: "Failed to retrieve asset" },
      { status: 500 }
    );
  }
}
