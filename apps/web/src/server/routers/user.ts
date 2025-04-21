import {
  publicProcedure,
  protectedProcedure,
  permissionProtectedProcedure,
  router,
} from "..";
import { dbService } from "~/lib/services";
import { hash } from "bcrypt";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { logger } from "~/lib/utils/logger";

// TODO: Move to users router

export const saltRounds = 10;

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const userRouter = router({
  // Get the total count of users
  count: permissionProtectedProcedure("system:users:read").query(async () => {
    return await dbService.users.count();
  }),

  // Get current user profile (using session)
  me: protectedProcedure.query(async ({ ctx }) => {
    const userIdString = ctx.session.user.id;
    const userId = parseInt(userIdString, 10);

    if (isNaN(userId)) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid user ID format.",
      });
    }

    const user = await dbService.users.getById(userId);

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const groups = await dbService.groups.getUserGroups(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      groups: groups.map((g) => ({ id: g.id, name: g.name })),
    };
  }),

  // Register a new user
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      try {
        // 1. Check if it's the first user using dbService
        const userCount = await dbService.users.count();
        const isFirstUser = userCount === 0;

        // 2. Check if email already exists using dbService
        const existingUser = await dbService.users.findByEmail(input.email);

        if (existingUser) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "User with this email already exists",
          });
        }

        // 3. Hash the password
        const hashedPassword = await hash(input.password, saltRounds);

        // 4. Create the user using dbService
        const newUser = await dbService.users.create({
          name: input.name,
          email: input.email,
          password: hashedPassword,
        });

        if (!newUser) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create user.",
          });
        }

        // 5. If it's the first user, assign to Administrators group
        if (isFirstUser) {
          const adminGroup = await dbService.groups.findByName(
            "Administrators"
          );
          if (adminGroup) {
            const added = await dbService.groups.addUserToGroup(
              newUser.id,
              adminGroup.id
            );
            if (added) {
              logger.log(
                `First user ${newUser.email} automatically assigned to Administrators group.`
              );
            } else {
              logger.error(
                `Failed to assign first user ${newUser.email} to Administrators group.`
              );
            }
          } else {
            logger.error(
              "CRITICAL: Administrators group not found during first user registration! Seeding might have failed."
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Failed to assign administrative privileges. Administrator group not found.",
            });
          }
        } else {
          // For non-first users, add them to the Viewers group
          const viewerGroup = await dbService.groups.findByName("Viewers");
          if (viewerGroup) {
            const added = await dbService.groups.addUserToGroup(
              newUser.id,
              viewerGroup.id
            );
            if (added) {
              logger.log(
                `New user ${newUser.email} automatically assigned to Viewers group.`
              );
            } else {
              logger.error(
                `Failed to assign new user ${newUser.email} to Viewers group.`
              );
            }
          } else {
            logger.error(
              "CRITICAL: Viewers group not found during user registration! Seeding might have failed."
            );
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Failed to assign user to Viewers group. Viewers group not found.",
            });
          }
        }

        // Return relevant user info (excluding password)
        return {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          isFirstUser: isFirstUser,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        logger.error("Registration error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred during registration",
        });
      }
    }),
});
