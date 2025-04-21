#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Docker container configuration
CONTAINER_NAME="nextwiki-postgres"
DB_USER="nextwiki"
DB_PASSWORD="nextwiki_password"
DB_NAME="nextwiki"
DB_PORT="5432"
HOST_PORT="5432"

echo -e "${BLUE}NextWiki Docker Database Setup${NC}"
echo "This script will:"
echo "1. Create a PostgreSQL database in a Docker container"
echo "2. Set up the database with required credentials"
echo "3. Update your .env file with the connection string"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed or not in PATH${NC}"
    echo "Please install Docker and try again"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again"
    exit 1
fi

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo -e "${BLUE}Container ${CONTAINER_NAME} already exists${NC}"
    
    # Check if container is running
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "Container is already running"
    else
        echo "Starting existing container..."
        docker start ${CONTAINER_NAME}
        echo -e "${GREEN}Container started successfully${NC}"
    fi
else
    echo -e "${BLUE}Creating new PostgreSQL container...${NC}"
    
    # Run PostgreSQL container
    docker run --name ${CONTAINER_NAME} \
        -e POSTGRES_USER=${DB_USER} \
        -e POSTGRES_PASSWORD=${DB_PASSWORD} \
        -e POSTGRES_DB=${DB_NAME} \
        -p ${HOST_PORT}:${DB_PORT} \
        -d postgres:15
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to create PostgreSQL container${NC}"
        exit 1
    fi
    
    echo "Waiting for PostgreSQL to start up..."
    sleep 5
    
    # Check if container is running
    if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${RED}Container failed to start properly${NC}"
        echo "Check Docker logs with: docker logs ${CONTAINER_NAME}"
        exit 1
    fi
    
    echo -e "${GREEN}PostgreSQL container created and running${NC}"
fi

# Create connection string
CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${HOST_PORT}/${DB_NAME}"

# Check if .env file exists
if [ -f .env ]; then
    echo "Updating existing .env file"
    
    # Check if DATABASE_URL already exists in .env
    if grep -q "^DATABASE_URL=" .env; then
        # Replace existing DATABASE_URL
        sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${CONNECTION_STRING}|" .env
        rm -f .env.bak
    else
        # Add DATABASE_URL to .env
        echo "DATABASE_URL=${CONNECTION_STRING}" >> .env
    fi
else
    echo "Creating new .env file"
    cp .env.example .env
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=${CONNECTION_STRING}|" .env
    rm -f .env.bak
fi

echo -e "${GREEN}Database setup completed successfully!${NC}"
echo "Connection string: ${CONNECTION_STRING}"
echo ""
echo "Your .env file has been updated with the database connection string."
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Run migrations: npm run db:migrate"
echo "2. Start the application: npm run dev"
echo ""
echo "To stop the database container: docker stop ${CONTAINER_NAME}"
echo "To start it again: docker start ${CONTAINER_NAME}" 