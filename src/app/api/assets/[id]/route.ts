import { NextResponse } from "next/server";
import { assetService } from "~/lib/services";
import { z } from "zod";

const ParamsSchema = z.object({
  id: z.string().uuid("Invalid asset ID format"),
});

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Access params from the context
    const params = context.params;
    const resolvedParams = await params;

    // Validate the ID format using Zod
    const validationResult = ParamsSchema.safeParse(resolvedParams);
    if (!validationResult.success) {
      console.error("Zod Validation Error:", validationResult.error.format()); // Log detailed Zod error
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { id } = validationResult.data;

    // Get asset from database using service
    const asset = await assetService.getById(id);

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Extract base64 data if it includes the data URI prefix
    let base64Data = asset.data;
    const prefixMatch = asset.data.match(/^data:.*;base64,/);
    if (prefixMatch) {
      base64Data = asset.data.substring(prefixMatch[0].length);
    }

    // Decode base64 data
    const buffer = Buffer.from(base64Data, "base64");

    // Create response with appropriate Content-Type and Cache-Control
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": asset.fileType,
        "Content-Disposition": `inline; filename="${asset.fileName}"`,
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
