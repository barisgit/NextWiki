import { db, users, accounts } from "~/lib/db";
import { eq } from "drizzle-orm";
import { hash } from "bcrypt";
import readline from "readline";

// Instead of trying to locate and load .env file here,
// we'll use env-cmd to run this script:
// npx env-cmd -f .env tsx scripts/create-admin.ts

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function promptQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  console.log("NextWiki Admin User Creation");
  console.log("===========================");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    console.error("Please run this script with env-cmd:");
    console.error("npx env-cmd -f .env tsx scripts/create-admin.ts");
    process.exit(1);
  }

  const email = await promptQuestion("Email: ");

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    const confirm = await promptQuestion(
      `User ${email} already exists. Promote to admin? (y/n): `
    );
    if (confirm.toLowerCase() === "y") {
      await db
        .update(users)
        .set({ isAdmin: true })
        .where(eq(users.email, email));

      console.log(`User ${email} has been promoted to admin.`);
    } else {
      console.log("Operation cancelled.");
    }
  } else {
    const name = await promptQuestion("Name: ");
    const password = await promptQuestion("Password: ");

    // Hash the password for secure storage
    const hashedPassword = await hash(password, 10);

    // Create the user with admin privileges and password
    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        password: hashedPassword, // Store hashed password in the users table
        isAdmin: true,
      })
      .returning();

    if (!newUser) {
      throw new Error("Failed to create user");
    }

    // Create credentials entry for NextAuth
    await db.insert(accounts).values({
      userId: newUser.id,
      type: "credentials",
      provider: "credentials",
      providerAccountId: newUser.id.toString(), // Use the user ID as the provider account ID
    });

    console.log(`Admin user ${email} created successfully.`);
    console.log(
      `You can now log in using the email and password you provided.`
    );
  }

  rl.close();
}

main()
  .catch((err) => {
    console.error("Error creating admin user:", err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
