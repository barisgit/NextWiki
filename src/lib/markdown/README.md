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
      content={page.content}   // Original markdown (needed for search)
      renderedHtml={renderedHtml}  // Pre-rendered HTML
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

1. **Factory Pattern**: Both renderers use the same configuration through `createMarkdownProcessor`
2. **Consistent Plugins**: All remark/rehype plugins are shared
3. **Component Mapping**: All HTML elements are mapped to the same React components

## Best Practices

1. **Always use `HighlightedContent` when possible**, providing both the original markdown and pre-rendered HTML
2. Use consistent CSS classes on the wrapper elements
3. For live previews, use `HighlightedMarkdown` directly
4. For server-rendered content, use `renderMarkdownToHtml` and pass the result to `HighlightedContent`

## Testing for Consistency

To ensure your rendered content looks the same on both server and client:

1. Compare snapshots of server-rendered and client-rendered output
2. Test with complex markdown including various elements (tables, code, etc.)
3. Verify styling is consistent across both render methods 