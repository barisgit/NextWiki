#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
};

// Docker container configuration
const config = {
  containerName: 'nextwiki-postgres',
  dbUser: 'nextwiki',
  dbPassword: 'nextwiki_password',
  dbName: 'nextwiki',
  dbPort: '5432',
  hostPort: '5432',
};

// Utility to print colored messages
const print = {
  info: (message) => console.log(`${colors.blue}${message}${colors.reset}`),
  success: (message) => console.log(`${colors.green}${message}${colors.reset}`),
  error: (message) => console.log(`${colors.red}${message}${colors.reset}`),
  normal: (message) => console.log(message),
};

// Utility to run shell commands
function runCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8' });
  } catch (error) {
    print.error(`Command failed: ${command}`);
    print.error(error.message);
    throw error;
  }
}

// Check if a command exists in the PATH
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if Docker container exists
function containerExists(name) {
  try {
    const containers = runCommand('docker ps -a --format "{{.Names}}"');
    return containers.split('\n').includes(name);
  } catch (error) {
    return false;
  }
}

// Check if Docker container is running
function containerRunning(name) {
  try {
    const containers = runCommand('docker ps --format "{{.Names}}"');
    return containers.split('\n').includes(name);
  } catch (error) {
    return false;
  }
}

// Update .env file with database connection string
function updateEnvFile(connectionString) {
  const rootDir = path.resolve(__dirname, '..');
  const envPath = path.join(rootDir, '.env');
  const envExamplePath = path.join(rootDir, '.env.example');

  if (fs.existsSync(envPath)) {
    print.normal('Updating existing .env file');
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('DATABASE_URL=')) {
      // Replace existing DATABASE_URL
      envContent = envContent.replace(
        /^DATABASE_URL=.*/m,
        `DATABASE_URL=${connectionString}`
      );
    } else {
      // Add DATABASE_URL to .env
      envContent += `\nDATABASE_URL=${connectionString}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
  } else {
    print.normal('Creating new .env file');
    
    if (fs.existsSync(envExamplePath)) {
      // Copy from example and update
      let envContent = fs.readFileSync(envExamplePath, 'utf8');
      envContent = envContent.replace(
        /^DATABASE_URL=.*/m,
        `DATABASE_URL=${connectionString}`
      );
      fs.writeFileSync(envPath, envContent);
    } else {
      // Create minimal .env file
      fs.writeFileSync(envPath, `DATABASE_URL=${connectionString}\n`);
    }
  }
}

// Main function
async function main() {
  print.info('NextWiki Docker Database Setup');
  print.normal('This script will:');
  print.normal('1. Create a PostgreSQL database in a Docker container');
  print.normal('2. Set up the database with required credentials');
  print.normal('3. Update your .env file with the connection string');
  print.normal('');

  // Check if Docker is installed
  if (!commandExists('docker')) {
    print.error('Error: Docker is not installed or not in PATH');
    print.normal('Please install Docker and try again');
    process.exit(1);
  }

  // Check if Docker is running
  try {
    runCommand('docker info > /dev/null 2>&1');
  } catch (error) {
    print.error('Error: Docker is not running');
    print.normal('Please start Docker and try again');
    process.exit(1);
  }

  // Check if container already exists
  if (containerExists(config.containerName)) {
    print.info(`Container ${config.containerName} already exists`);
    
    // Check if container is running
    if (containerRunning(config.containerName)) {
      print.normal('Container is already running');
    } else {
      print.normal('Starting existing container...');
      runCommand(`docker start ${config.containerName}`);
      print.success('Container started successfully');
    }
  } else {
    print.info('Creating new PostgreSQL container...');
    
    // Run PostgreSQL container
    runCommand(`docker run --name ${config.containerName} \
      -e POSTGRES_USER=${config.dbUser} \
      -e POSTGRES_PASSWORD=${config.dbPassword} \
      -e POSTGRES_DB=${config.dbName} \
      -p ${config.hostPort}:${config.dbPort} \
      -d postgres:15`);
    
    print.normal('Waiting for PostgreSQL to start up...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check if container is running
    if (!containerRunning(config.containerName)) {
      print.error('Container failed to start properly');
      print.normal(`Check Docker logs with: docker logs ${config.containerName}`);
      process.exit(1);
    }
    
    print.success('PostgreSQL container created and running');
  }

  // Create connection string
  const connectionString = `postgresql://${config.dbUser}:${config.dbPassword}@localhost:${config.hostPort}/${config.dbName}`;
  
  // Update .env file
  updateEnvFile(connectionString);

  print.success('Database setup completed successfully!');
  print.normal(`Connection string: ${connectionString}`);
  print.normal('');
  print.normal('Your .env file has been updated with the database connection string.');
  print.normal('');
  print.info('Next steps:');
  print.normal('1. Run migrations: npm run db:migrate');
  print.normal('2. Start the application: npm run dev');
  print.normal('');
  print.normal(`To stop the database container: docker stop ${config.containerName}`);
  print.normal(`To start it again: docker start ${config.containerName}`);
}

// Run the main function
main().catch(error => {
  print.error('An error occurred:');
  print.error(error.message);
  process.exit(1);
}); 