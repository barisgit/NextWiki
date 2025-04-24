import { NextRequest } from "next/server";
import { generateOpenApiDocument } from "trpc-to-openapi";

import { appRouter } from "~/server/routers";

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: "NextWiki OpenAPI",
  version: "1.0.0",
  baseUrl: "http://localhost:3000",
});

export async function GET(request: NextRequest) {
  void request;
  return new Response(JSON.stringify(openApiDocument), {
    headers: { "Content-Type": "application/json" },
  });
}
