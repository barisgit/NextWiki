"use client";

import { PropsWithChildren, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TRPCProvider } from "./client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createWSClient, httpBatchLink, wsLink, splitLink } from "@trpc/client";
import { createTRPCClient } from "@trpc/client";
import { AppRouter } from "./routers";
import { env } from "~/env";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function TRPCClientProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() => {
    if (env.NEXT_PUBLIC_WS_URL) {
      const wsClient = createWSClient({
        url: `ws://${env.NEXT_PUBLIC_WS_URL}`,
      });

      return createTRPCClient<AppRouter>({
        links: [
          splitLink({
            condition(op) {
              return op.type === "subscription";
            },
            true: wsLink({
              client: wsClient,
            }),
            false: httpBatchLink({
              url: `/api/trpc`,
            }),
          }),
        ],
      });
    }

    return createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: `/api/trpc`,
        }),
      ],
    });
  });

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
