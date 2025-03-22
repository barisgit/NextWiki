import { publicProcedure, router, protectedProcedure } from "..";
import { db } from "~/lib/db";
import { sql, eq } from "drizzle-orm";
import { users } from "~/lib/db/schema";
import { hash } from "bcrypt";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().default(false),
});

export const userRouter = router({
  // Get the total count of users
  count: publicProcedure.query(async () => {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count);
  }),

  // Get current user profile (using session)
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const user = await db.query.users.findFirst({
      where: (users) => eq(users.id, parseInt(userId)),
      columns: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        image: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    return user;
  }),

  // Register a new user
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      try {
        // Check if email already exists
        const existingUser = await db.query.users.findFirst({
          where: (users) => eq(users.email, input.email),
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User with this email already exists",
          });
        }

        // Hash the password
        const hashedPassword = await hash(input.password, 10);

        // Create the user
        const [user] = await db
          .insert(users)
          .values({
            name: input.name,
            email: input.email,
            password: hashedPassword,
            isAdmin: input.isAdmin,
          })
          .returning();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      } catch (error) {
        // If it's already a TRPCError, throw it directly
        if (error instanceof TRPCError) {
          throw error;
        }

        console.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during registration",
        });
      }
    }),
});
