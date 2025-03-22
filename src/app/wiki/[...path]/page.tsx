import { notFound } from 'next/navigation';
import { MainLayout } from '~/components/layout/MainLayout';
import { WikiPage } from '~/components/wiki/WikiPage';
import { ClientWikiEditor } from '~/components/wiki/ClientWikiEditor';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';

// This function would be replaced with a real data fetch from your database
async function getWikiPageByPath(path: string[]) {
  // For demo purposes, we'll return mock data
  const joinedPath = `/${path.join('/')}`;
  
  if (joinedPath === '/getting-started') {
    return {
      id: 1,
      title: 'Getting Started with NextWiki',
      path: '/getting-started',
      content: `
# Getting Started with NextWiki

Welcome to NextWiki, a modern wiki system built with Next.js, Drizzle ORM, tRPC, and NextAuth.

## Features

- Modern Stack: Built with Next.js 15, React 19, and more
- Real-time Collaboration: Multiple users can edit pages simultaneously
- Version History: Track changes and revert to previous versions
- Markdown Support: Write content using simple Markdown syntax

## Quick Start

1. Clone the repository
2. Install dependencies with \`npm install\`
3. Configure your environment variables
4. Run the development server with \`npm run dev\`

## Code Example

\`\`\`typescript
// Example of using tRPC in NextWiki
export const appRouter = router({
  wiki: wikiRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
\`\`\`

## Next Steps

- Check out the API Documentation
- Learn about the database schema
- Explore the authentication system
      `,
      createdAt: new Date('2023-01-15T10:00:00Z'),
      updatedAt: new Date('2023-02-20T14:30:00Z'),
      createdBy: { name: 'John Doe', id: 1 },
      updatedBy: { name: 'Jane Smith', id: 2 },
      tags: [
        { id: 1, name: 'guide' },
        { id: 2, name: 'beginner' },
      ],
    };
  } else if (joinedPath === '/api-documentation') {
    return {
      id: 2,
      title: 'API Documentation',
      path: '/api-documentation',
      content: `
# API Documentation

This page documents the API endpoints available in NextWiki.

## Authentication

NextWiki uses NextAuth for authentication. All API endpoints require authentication unless stated otherwise.

## Endpoints

### GET /api/wiki/pages

Returns a list of all wiki pages.

### GET /api/wiki/pages/:id

Returns a single wiki page by ID.

### POST /api/wiki/pages

Creates a new wiki page.

### PUT /api/wiki/pages/:id

Updates an existing wiki page.

### DELETE /api/wiki/pages/:id

Deletes a wiki page.
      `,
      createdAt: new Date('2023-01-20T10:00:00Z'),
      updatedAt: new Date('2023-02-25T14:30:00Z'),
      createdBy: { name: 'John Doe', id: 1 },
      updatedBy: { name: 'John Doe', id: 1 },
      tags: [
        { id: 3, name: 'api' },
        { id: 4, name: 'reference' },
      ],
    };
  } else if (joinedPath === '/installation') {
    return {
      id: 3,
      title: 'Installation Guide',
      path: '/installation',
      content: `
# Installation Guide

This guide will walk you through the process of installing NextWiki.

## Prerequisites

- Node.js 18+
- PostgreSQL database

## Steps

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourusername/nextwiki.git
   cd nextwiki
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Configure environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
4. Edit the \`.env.local\` file with your database connection and auth settings

5. Set up the database:
   \`\`\`bash
   npm run db:generate
   npm run db:migrate
   \`\`\`

6. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

7. Open [http://localhost:3000](http://localhost:3000) in your browser
      `,
      createdAt: new Date('2023-01-25T10:00:00Z'),
      updatedAt: new Date('2023-03-01T14:30:00Z'),
      createdBy: { name: 'Jane Smith', id: 2 },
      updatedBy: { name: 'Jane Smith', id: 2 },
      tags: [
        { id: 2, name: 'beginner' },
        { id: 5, name: 'setup' },
      ],
    };
  }
  
  // Return null if page is not found
  return null;
}

interface PageProps {
  params: { path: string[] };
  searchParams: { edit?: string };
}

export default async function WikiPageView({ params, searchParams }: PageProps) {
  const page = await getWikiPageByPath(params.path);
  
  if (!page) {
    notFound();
  }

  // Check if we're in edit mode
  const isEditMode = searchParams.edit === 'true';

  if (isEditMode) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Wiki Page</h1>
            <p className="text-muted-foreground mt-1">
              Update the content and metadata for this wiki page.
            </p>
          </div>
          
          <div className="mt-6">
            <ClientWikiEditor 
              initialTitle={page.title}
              initialContent={page.content}
              initialTags={page.tags ? page.tags.map(tag => tag.name) : []}
              pagePath={page.path}
            />
          </div>
        </div>
      </MainLayout>
    );
  }

  // View mode
  return (
    <MainLayout>
      <WikiPage
        title={page.title}
        content={
          <div className="prose prose-blue max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeHighlight]}
            >
              {page.content}
            </ReactMarkdown>
          </div>
        }
        createdAt={new Date(page.createdAt)}
        updatedAt={new Date(page.updatedAt)}
        createdBy={page.createdBy}
        updatedBy={page.updatedBy}
        tags={page.tags}
        path={page.path}
      />
    </MainLayout>
  );
} 