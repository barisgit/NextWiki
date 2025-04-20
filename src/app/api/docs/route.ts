import { NextResponse } from "next/server";
import { appRouter } from "~/lib/trpc/routers"; // Import your main tRPC router

export async function GET() {
  // Only allow access in development environment
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Dynamically import renderTrpcPanel only in development
  const { renderTrpcPanel } = await import("trpc-ui");

  return new NextResponse(
    renderTrpcPanel(appRouter, {
      // Set the base URL for your tRPC API endpoint
      url: "/api/trpc",
      // Omit transformer option as superjson is not detected
      // transformer: "superjson",
      meta: {
        title: "NextWiki tRPC Panel",
        description:
          "UI for testing the NextWiki tRPC API during development. To authorize copy next-auth.session-token from cookies and paste into the Authorization header in this syntax: Bearer <token>",
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
    }
  );
}

// Add JSDoc for clarity
/**
 * @swagger
 * /api/panel:
 *   get:
 *     summary: Renders the tRPC UI panel (Development Only)
 *     description: Provides an HTML interface for interacting with the tRPC API endpoints during development. Access is restricted to NODE_ENV=development.
 *     tags: [dev-tools]
 *     responses:
 *       200:
 *         description: HTML content for the tRPC UI panel.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               format: html
 *       404:
 *         description: Not Found. Only accessible in development mode.
 */
