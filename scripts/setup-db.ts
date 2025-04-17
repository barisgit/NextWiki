#!/usr/bin/env node

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { Pool } from "pg"; // Import Pool for DB connection check

// Colors for terminal output
const colors = {
  green: "\x1b[32m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
};

// Docker container configuration
const config = {
  containerName: "nextwiki-postgres",
  dbUser: "nextwiki",
  dbPassword: "nextwiki_password",
  dbName: "nextwiki",
  dbPort: "5432",
  hostPort: "5432", // Use the same port for host and container for simplicity
};

// Utility to print colored messages
const print = {
  info: (message: string) =>
    console.log(`${colors.blue}${message}${colors.reset}`),
  success: (message: string) =>
    console.log(`${colors.green}${message}${colors.reset}`),
  error: (message: string) =>
    console.log(`${colors.red}${message}${colors.reset}`),
  normal: (message: string) => console.log(message),
};

// Utility to run shell commands
function runCommand(command: string, ignoreError = false): string | null {
  try {
    print.normal(`Executing: ${command}`);
    const output = execSync(command, { encoding: "utf8", stdio: "pipe" }); // Use pipe to capture output, inherit for logs if needed
    // print.normal(output); // Optionally log command output
    return output;
  } catch (error: unknown) {
    print.error(`Command failed: ${command}`);
    if (error instanceof Error && "stderr" in error) {
      print.error(`Stderr: ${error.stderr}`);
    }
    if (error instanceof Error && "stdout" in error) {
      print.error(`Stdout: ${error.stdout}`); // Log stdout on error too
    }
    if (!ignoreError) {
      throw error;
    }
    return null;
  }
}

// Check if a command exists in the PATH
function commandExists(command: string): boolean {
  try {
    // Use 'command -v' which is more portable than 'which'
    execSync(`command -v ${command}`, { stdio: "ignore" });
    return true;
  } catch (error) {
    void error;
    return false;
  }
}

// Check if Docker container exists
function containerExists(name: string): boolean {
  try {
    const output = runCommand('docker ps -a --format "{{.Names}}"');
    return !!output && output.split("\n").includes(name);
  } catch (error) {
    void error;
    // If docker command fails (e.g., docker not running), treat as container not existing
    return false;
  }
}

// Check if Docker container is running
function containerRunning(name: string): boolean {
  try {
    const output = runCommand('docker ps --format "{{.Names}}"');
    return !!output && output.split("\n").includes(name);
  } catch (error) {
    void error;
    // If docker command fails, treat as container not running
    return false;
  }
}

// Update .env file with database connection string
function updateEnvFile(connectionString: string): void {
  const rootDir = path.resolve(__dirname, "..");
  const envPath = path.join(rootDir, ".env");
  const envExamplePath = path.join(rootDir, ".env.example");
  const dbUrlKey = "DATABASE_URL";
  const dbUrlLine = `${dbUrlKey}=${connectionString}`;

  print.normal(`Ensuring ${dbUrlKey} is set in ${envPath}`);

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf8");
    const dbUrlRegex = new RegExp(`^${dbUrlKey}=.*`, "m");

    if (dbUrlRegex.test(envContent)) {
      // Replace existing DATABASE_URL
      envContent = envContent.replace(dbUrlRegex, dbUrlLine);
      print.normal(`Updated existing ${dbUrlKey}.`);
    } else {
      // Add DATABASE_URL to .env
      envContent += `\n${dbUrlLine}\n`;
      print.normal(`Added ${dbUrlKey}.`);
    }
    fs.writeFileSync(envPath, envContent);
  } else {
    print.normal(`Creating ${envPath} from scratch or example.`);
    let envContent = "";
    if (fs.existsSync(envExamplePath)) {
      envContent = fs.readFileSync(envExamplePath, "utf8");
      const dbUrlRegex = new RegExp(`^${dbUrlKey}=.*`, "m");
      if (dbUrlRegex.test(envContent)) {
        envContent = envContent.replace(dbUrlRegex, dbUrlLine);
      } else {
        envContent += `\n${dbUrlLine}\n`;
      }
      print.normal(`Used ${envExamplePath} as template.`);
    } else {
      // Create minimal .env file
      envContent = `${dbUrlLine}\n`;
      print.normal(`Created minimal ${envPath}.`);
    }
    fs.writeFileSync(envPath, envContent);
  }
}

// Function to wait for DB connection
async function waitForDB(
  connectionString: string,
  retries = 15,
  delay = 3000
): Promise<void> {
  print.info(`Attempting to connect to database... (up to ${retries} retries)`);
  for (let i = 0; i < retries; i++) {
    try {
      const pool = new Pool({ connectionString });
      await pool.query("SELECT 1");
      await pool.end();
      print.success("Database connection successful!");
      return;
    } catch (error: unknown) {
      print.normal(
        `Attempt ${i + 1} failed. Retrying in ${delay / 1000}s... (${
          error instanceof Error ? error.message : String(error)
        })`
      );
      if (i === retries - 1) {
        print.error("Database connection failed after multiple retries.");
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Main function
async function main(): Promise<void> {
  print.info("🚀 NextWiki Docker Database Setup 🚀");
  print.normal("This script will:");
  print.normal("1. Check for Docker and required commands (pnpm).");
  print.normal("2. Ensure a PostgreSQL container is running.");
  print.normal("3. Update your .env file with the connection string.");
  print.normal("4. Wait for the database to be ready.");
  print.normal("5. Generate Drizzle migrations.");
  print.normal("6. Apply Drizzle migrations.");
  print.normal("7. Seed the database.");
  print.normal("");

  // --- Prerequisites Check ---
  if (!commandExists("docker")) {
    print.error("❌ Error: Docker is not installed or not in PATH.");
    print.normal("Please install Docker: https://docs.docker.com/get-docker/");
    process.exit(1);
  }
  if (!commandExists("pnpm")) {
    print.error("❌ Error: pnpm is not installed or not in PATH.");
    print.normal("Please install pnpm: https://pnpm.io/installation");
    process.exit(1);
  }

  try {
    runCommand("docker info", true); // Check if Docker daemon is running
  } catch (error) {
    void error;
    print.error("❌ Error: Docker daemon is not running.");
    print.normal("Please start Docker and try again.");
    process.exit(1);
  }
  print.success("✅ Prerequisites met (Docker, pnpm).");

  // --- Docker Container Setup ---
  if (containerExists(config.containerName)) {
    print.info(`➡️ Container "${config.containerName}" already exists.`);
    if (!containerRunning(config.containerName)) {
      print.normal("Starting existing container...");
      runCommand(`docker start ${config.containerName}`);
      print.success("Container started.");
    } else {
      print.normal("Container is already running.");
    }
  } else {
    print.info(
      `✨ Creating new PostgreSQL container "${config.containerName}"...`
    );
    const dockerCommand = `docker run --name ${config.containerName} \
      -e POSTGRES_USER=${config.dbUser} \
      -e POSTGRES_PASSWORD=${config.dbPassword} \
      -e POSTGRES_DB=${config.dbName} \
      -p ${config.hostPort}:${config.dbPort} \
      --health-cmd="pg_isready -U ${config.dbUser} -d ${config.dbName}" \
      --health-interval=5s \
      --health-timeout=5s \
      --health-retries=5 \
      -d postgres:17`; // Using postgres:17, consider locking version or making configurable
    runCommand(dockerCommand);

    // Wait briefly for container to initialize before checking health/connection
    print.normal("Waiting a few seconds for container to initialize...");
    await new Promise((resolve) => setTimeout(resolve, 5000));

    if (!containerRunning(config.containerName)) {
      print.error("❌ Container failed to start properly.");
      print.normal(`Check Docker logs: docker logs ${config.containerName}`);
      process.exit(1);
    }
    print.success("✅ PostgreSQL container created and running.");
  }

  // --- Environment Setup ---
  const connectionString = `postgresql://${config.dbUser}:${config.dbPassword}@localhost:${config.hostPort}/${config.dbName}`;
  updateEnvFile(connectionString);
  print.success("✅ .env file updated successfully.");
  print.normal(
    `Connection string: ${connectionString.replace(config.dbPassword, "****")}`
  ); // Hide password in log

  // --- Wait for DB ---
  await waitForDB(connectionString);

  // --- Database Schema and Data ---
  try {
    print.info("🔄 Generating database migrations...");
    runCommand("pnpm db:generate");
    print.success("✅ Migrations generated successfully.");

    print.info("🔄 Applying database migrations...");
    runCommand("pnpm db:migrate"); // Assumes 'db:migrate' script uses tsx
    print.success("✅ Migrations applied successfully.");

    print.info("🌱 Seeding database...");
    runCommand("pnpm db:seed"); // Assumes 'db:seed' script uses tsx
    print.success("✅ Database seeded successfully.");
  } catch (error) {
    void error;
    print.error("❌ An error occurred during migration or seeding.");
    // Error details are already printed by runCommand
    process.exit(1);
  }

  // --- Completion ---
  print.success("🎉 All setup steps completed successfully! 🎉");
  print.normal("");
  print.info("Next steps:");
  print.normal("   Start the application: pnpm dev");
  print.normal("");
  print.info("Container management:");
  print.normal(`   Stop the database: docker stop ${config.containerName}`);
  print.normal(`   Start the database: docker start ${config.containerName}`);
  print.normal(`   View logs: docker logs ${config.containerName}`);
  print.normal(`   Remove the container: docker rm -f ${config.containerName}`);
  print.normal(
    `   Remove container and data: docker rm -f -v ${config.containerName}`
  );
}

// Run the main function
main().catch((error) => {
  void error;
  // Error details should have been printed already by internal functions
  print.error("❌ Setup script failed.");
  process.exit(1);
});
