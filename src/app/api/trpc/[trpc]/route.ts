import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/lib/trpc/routers";
import { createContext } from "~/lib/trpc";

// Set CORS headers for API routes
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS requests - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Handle all tRPC requests
export async function GET(
  req: Request,
  { params }: { params: Promise<{ trpc: string }> }
) {
  const resolvedParams = await params;
  void resolvedParams;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ trpc: string }> }
) {
  const resolvedParams = await params;
  void resolvedParams;
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
            );
          }
        : undefined,
  });
}
