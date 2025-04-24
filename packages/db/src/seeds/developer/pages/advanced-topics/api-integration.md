---
path: advanced-topics/api-integration
title: API Integration
author: NextWiki Team
createdAt: 2024-01-01T00:00:00.000Z
updated: 2024-01-01T00:00:00.000Z
tags: [advanced, api, integration, trpc, development]
---

# API Integration

This page provides a brief overview of how external applications or scripts could potentially interact with NextWiki's backend.

## tRPC API

NextWiki uses tRPC for its internal API communication between the Next.js frontend and backend. While primarily designed for internal use, understanding the tRPC endpoints can be useful for advanced integrations or debugging.

```typescript
// Example hypothetical client-side tRPC usage
import { useTrpc } from '@nextwiki/sdk';
import { useQuery } from '@tanstack/react-query';

function SomeComponent() {
  const trpc = useTrpc();
  const { data: page, isLoading } = useQuery(trpc.page.getByPath.queryOptions({ path: 'getting-started' }));

  if (isLoading) return <p>Loading...</p>;
  if (!page) return <p>Page not found</p>;

  return (
    <div>
      <h1>{page.title}</h1>
      {/* Render page content */}
    </div>
  );
}
```

## Future Considerations

A dedicated public REST API might be considered in the future for easier third-party integrations.

**Note:** Direct API interaction is an advanced topic and may change between NextWiki versions. Proceed with caution. 