import { type NextRequest, NextResponse } from "next/server";
import { assetService } from "~/lib/services";
import { checkServerPermission } from "~/lib/utils/server-auth-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assetId = params.id;

    // 1. Check Session and Permission using the helper
    const permissionResult = await checkServerPermission("assets:asset:read");

    if (!permissionResult.authorized) {
      return permissionResult.errorResponse!;
    }

    // 2. Fetch Asset Data (User is authorized at this point)
    const asset = await assetService.getById(assetId);

    if (!asset) {
      return new NextResponse("Asset not found", { status: 404 });
    }

    // 3. Decode Base64 Data
    if (!asset.data) {
      return new NextResponse("Asset data missing", { status: 500 });
    }
    let base64Data = asset.data;
    const prefixMatch = asset.data.match(/^data:.*;base64,/);
    if (prefixMatch) {
      base64Data = asset.data.substring(prefixMatch[0].length);
    }

    const buffer = Buffer.from(base64Data, "base64");

    // 4. Return Response
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": asset.fileType,
        "Content-Disposition": `inline; filename="${asset.fileName}"`,
        "Cache-Control": "public, max-age=31536000",
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[ASSET_API_ROUTE_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add OpenAPI definition if you want this documented separately
// from tRPC. Requires installing an OpenAPI generator for standard routes.
// export const GET = {
//   summary: 'Get raw asset data by ID',
//   parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
//   responses: {
//     '200': { description: 'Raw asset data', content: { '*/*': {} } }, // Indicate any content type
//     '401': { description: 'Unauthorized' },
//     '403': { description: 'Forbidden' },
//     '404': { description: 'Asset not found' },
//     '500': { description: 'Internal Server Error' },
//   },
//   tags: ['assets-raw'], // Separate tag maybe?
// };
