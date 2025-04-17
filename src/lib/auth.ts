import { db } from "~/lib/db";
import { users, userGroups, groups } from "~/lib/db/schema";
import { NextAuthOptions, getServerSession } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq, and } from "drizzle-orm";
import { compare } from "bcrypt";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

// Create auth options with the adapter set directly
export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    signOut: "/logout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check against real database users
        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email),
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await compare(
          credentials.password,
          user.password
        );
        if (!passwordMatch) {
          return null;
        }

        // Check if user is in Administrators group
        const adminGroup = await db.query.groups.findFirst({
          where: eq(groups.name, "Administrators"),
        });

        let isAdmin = false;
        if (adminGroup) {
          const adminGroupMembership = await db.query.userGroups.findFirst({
            where: and(
              eq(userGroups.userId, user.id),
              eq(userGroups.groupId, adminGroup.id)
            ),
          });
          isAdmin = !!adminGroupMembership;
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          isAdmin: isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (token.isAdmin !== undefined && session.user) {
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        // @ts-expect-error - we know isAdmin exists on our custom user
        token.isAdmin = user.isAdmin || false;
      } else if (token.sub) {
        // Check admin status on each token refresh to keep it updated
        const adminGroup = await db.query.groups.findFirst({
          where: eq(groups.name, "Administrators"),
        });

        let isAdmin = false;
        if (adminGroup) {
          const adminGroupMembership = await db.query.userGroups.findFirst({
            where: and(
              eq(userGroups.userId, parseInt(token.sub)),
              eq(userGroups.groupId, adminGroup.id)
            ),
          });
          isAdmin = !!adminGroupMembership;
          token.isAdmin = isAdmin;
        }
      }
      return token;
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);
