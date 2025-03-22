# NextWiki

An open-source wiki system built with modern web technologies, inspired by WikiJS. NextWiki provides a flexible, extensible platform for creating and managing knowledge bases.

## Features

- **Modern Stack**: Built with Next.js 15, React 19, Drizzle ORM, tRPC, and NextAuth
- **Real-time Collaboration**: Multiple users can edit pages simultaneously
- **Version History**: Track changes and revert to previous versions
- **Markdown Support**: Write content using simple Markdown syntax
- **Authentication**: Secure login with credentials or OAuth providers
- **Permissions**: Control who can view and edit content
- **Search**: Quickly find content throughout your wiki
- **Tags & Categories**: Organize your content effectively

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **API**: Type-safe APIs with [tRPC](https://trpc.io)
- **Authentication**: [NextAuth.js](https://next-auth.js.org)
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
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser to see the wiki.

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
