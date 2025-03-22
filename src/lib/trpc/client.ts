'use client';

import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '~/lib/trpc/routers';

// Export the tRPC API for use in components
export const trpc = createTRPCReact<AppRouter>(); 