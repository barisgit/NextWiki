import bcrypt from "bcryptjs";
import { db } from "../../index.js";
import * as schema from "../../schema/index.js";
import { eq } from "drizzle-orm";

const saltRounds = 10;

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_NAME = "Admin";
const ADMIN_PASSWORD = "12345678"; // Use environment variables in production!

const USER_EMAIL = "user@example.com";
const USER_NAME = "User";
const USER_PASSWORD = "12345678";

/**
 * Seeds the default administrator user if they don't exist.
 */
export async function seedAdminUser() {
  console.log("    ↳ Seeding admin user...");

  try {
    const existingAdmin = await db.query.users.findFirst({
      where: eq(schema.users.email, ADMIN_EMAIL),
    });

    if (existingAdmin) {
      console.log(
        `      ℹ️ Admin user (${ADMIN_EMAIL}) already exists. Skipping.`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    const [adminUser] = await db
      .insert(schema.users)
      .values({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        // emailVerified: new Date(), // Optionally mark email as verified
      })
      .returning();

    // Add admin to Administrators group
    if (adminUser) {
      await db.insert(schema.userGroups).values({
        groupId: 1, // Administrators group ID
        userId: adminUser.id,
      });
    }

    console.log(`      ✅ Created admin user: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error("      ❌ Error seeding admin user:", error);
  }
}

export async function seedUserUser() {
  console.log("    ↳ Seeding user user...");

  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(schema.users.email, USER_EMAIL),
    });

    if (existingUser) {
      console.log(
        `      ℹ️ User user (${USER_EMAIL}) already exists. Skipping.`
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(USER_PASSWORD, saltRounds);

    // We don't need to return the user here, as we don't need to assign it to a group
    await db.insert(schema.users).values({
      name: USER_NAME,
      email: USER_EMAIL,
      password: hashedPassword,
      // emailVerified: new Date(), // Optionally mark email as verified
    });

    console.log(`      ✅ Created user user: ${USER_EMAIL}`);
  } catch (error) {
    console.error("      ❌ Error seeding user user:", error);
  }
}
