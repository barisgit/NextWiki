# NextWiki

An open-source wiki system built with modern web technologies, inspired by WikiJS. NextWiki provides a flexible, extensible platform for creating and managing knowledge bases.

## Features

- **Modern Stack**: Built with Next.js 15, React 19, Drizzle ORM, tRPC, and NextAuth
- **Real-time Collaboration**: Multiple users can edit pages simultaneously
- **Version History**: Track changes and revert to previous versions
- **Markdown Support**: Write content using simple Markdown syntax
- **Authentication**: Secure login with credentials or OAuth providers
- **Permissions**: Control who can view and edit content
- **Advanced Search**: Full-text and fuzzy search with typo tolerance
- **Tags & Categories**: Organize your content effectively

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **API**: Type-safe APIs with [tRPC](https://trpc.io)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
- **Search**: PostgreSQL full-text search with trigram similarity for fuzzy matching
- **Styling**: Tailwind CSS
- **Deployment**: Compatible with Vercel, Netlify, or self-hosted

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or Neon serverless PostgreSQL)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/nextwiki.git
   cd nextwiki
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and configure it:
   ```bash
   cp .env.example .env.local
   ```
   Update the values in `.env.local` with your database and authentication settings.

4. Set up the database:
   ```bash
   npm run db:generate  # Generate migrations
   npm run db:migrate   # Apply migrations
   npm run db:setup     # Setup database with fuzzy search capabilities
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the wiki.

## Search Features

NextWiki includes a powerful search system with several capabilities:

- **Full-text search**: Using PostgreSQL's tsvector/tsquery for efficient text search
- **Fuzzy matching**: Find content even when search terms have typos
- **Highlighted results**: Search results and matched terms are highlighted
- **Multi-layer approach**:
  1. Exact vector matching (highest relevance)
  2. Title matching (high relevance)
  3. Content matching (medium relevance)
  4. Similarity matching for typos (lower relevance)

### Search Implementation

The search functionality is implemented in two parts:

1. **Schema Definition**: The Drizzle schema defines regular indexes on text fields.
2. **Index Conversion**: A migration script converts these to specialized GIN trigram indexes.

This approach allows us to define the structure in the schema while getting the specialized PostgreSQL functionality we need for fuzzy search.

When a user clicks a search result, they'll be taken directly to the page with all instances of the search term highlighted, and the view will automatically scroll to the first match.

## Project Structure

```
/
├── drizzle/             # Database migrations
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Layout components
│   │   └── wiki/        # Wiki-specific components
│   ├── lib/             # Shared libraries
│   │   ├── db/          # Database connection and schema
│   │   └── trpc/        # tRPC routers and procedures
│   └── types/           # TypeScript type definitions
└── ... configuration files
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
