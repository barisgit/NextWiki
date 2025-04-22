# NextWiki Scripts

This directory contains utility scripts for setting up and managing your NextWiki development environment.

## Database Setup Scripts

### `setup-db.ts` (TypeScript)

A TypeScript script that creates a PostgreSQL database in Docker and configures your `.env` file with the connection string.

```bash
# Run with npm script
pnpm run db:setup

# Or directly
tsx scripts/setup-db.ts
```

### `setup-db.sh` (Bash)

A bash script that does the same as the TypeScript version but for users who prefer shell scripts.
Note: This script as of now does not migrate or seed the database.

```bash
# Make sure it's executable first (only needed once)
chmod +x scripts/setup-db.sh

# Run the script
./scripts/setup-db.sh
```

## What These Scripts Do

1. Check if Docker is installed and running
2. Create a PostgreSQL container for NextWiki if it doesn't exist
3. Start the container if it exists but isn't running
4. Create or update your `.env` file with the database connection string

## Container Details

The scripts create a Docker container with the following configuration:

- **Container Name**: nextwiki-postgres
- **PostgreSQL User**: nextwiki
- **PostgreSQL Password**: nextwiki_password
- **Database Name**: nextwiki
- **Port**: 5432 (standard PostgreSQL port)

## After Running the Script

After the script completes successfully, you should:

1. Run database migrations: `npm run db:migrate`
2. Start the NextWiki application: `npm run dev`

## Managing the Container

- **Stop the container**: `docker stop nextwiki-postgres`
- **Start the container**: `docker start nextwiki-postgres`
- **Remove the container**: `docker rm nextwiki-postgres` (only do this if you want to reset everything)
- **View container logs**: `docker logs nextwiki-postgres`
