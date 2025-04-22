# Markdown Rendering System

This library provides a unified approach to rendering markdown content both on the server and client side.

## Core Components

### `HighlightedContent` - Universal Renderer (Recommended)

The recommended component for most use cases. It can handle both pre-rendered HTML from the server and client-side markdown rendering.

```tsx
import { HighlightedContent, renderMarkdownToHtml } from "~/lib/markdown";

// Server component that fetches content
export async function WikiPage({ pageId }: { pageId: string }) {
  const page = await getWikiPage(pageId);

  // Pre-render the content on the server
  const renderedHtml = renderMarkdownToHtml(page.content);

  return (
    <HighlightedContent
      content={page.content} // Original markdown (needed for search)
      renderedHtml={renderedHtml} // Pre-rendered HTML
    />
  );
}
```

### For Client-Only Rendering (e.g., Live Preview)

Use `HighlightedMarkdown` for pure client-side rendering:

```tsx
import { HighlightedMarkdown } from "~/lib/markdown";

// In an editor component with live preview
export function MarkdownEditor({ content }: { content: string }) {
  return (
    <div className="preview-panel">
      <HighlightedMarkdown content={content} />
    </div>
  );
}
```

## How It Works

1. **Factory Pattern**: Both renderers use the same configuration through `createClientMarkdownProcessor` and `createServerMarkdownProcessor`
2. **Consistent Plugins**: All remark/rehype plugins are shared
3. **Component Mapping**: All HTML elements are mapped to the same React components

## Plugin Organization

This library organizes plugins in a structured way:

1. **Shared Plugins**: Located in `src/lib/markdown/plugins/`
2. **Server-Only Plugins**: Located in `src/lib/markdown/plugins/server-only/`

### Adding Server-Only Plugins

To create a server-only plugin:

1. Create a new file in the `plugins/server-only/` directory
2. Export your plugin as the default export
3. No additional configuration needed - it will be automatically loaded on the server

Example:

```ts
// src/lib/markdown/plugins/server-only/myServerPlugin.ts
import type { Plugin } from "unified";

interface MyPluginOptions {
  // Your options here
}

const myServerPlugin: Plugin<[MyPluginOptions?], any> = (options = {}) => {
  return (tree) => {
    // Plugin implementation
  };
};

export default myServerPlugin;
```

The system will automatically detect and load this plugin when running on the server.

## Best Practices

1. **Always use `HighlightedContent` when possible**, providing both the original markdown and pre-rendered HTML
2. Use consistent CSS classes on the wrapper elements
3. For live previews, use `HighlightedMarkdown` directly
4. For server-rendered content, use `renderMarkdownToHtml` and pass the result to `HighlightedContent`
5. Place server-only plugins in the `plugins/server-only/` directory to ensure they're automatically loaded

## Testing for Consistency

To ensure your rendered content looks the same on both server and client:

1. Compare snapshots of server-rendered and client-rendered output
2. Test with complex markdown including various elements (tables, code, etc.)
3. Verify styling is consistent across both render methods
