import { db } from "~/lib/db";
import { users } from "~/lib/db/schema";
import { NextAuthOptions, getServerSession } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { compare } from "bcrypt";

// Create auth options without the adapter initially
export const authOptions: NextAuthOptions = {
  adapter: undefined as unknown as Adapter, // Will be set dynamically
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

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
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
      }
      return token;
    },
  },
};

// Dynamically import and set the adapter
// This import happens at runtime, not in the module scope
(async () => {
  try {
    const { DrizzleAdapter } = await import("@auth/drizzle-adapter");
    // @ts-expect-error - we're setting it after initialization
    authOptions.adapter = DrizzleAdapter(db) as Adapter;
  } catch (error) {
    console.error("Failed to load DrizzleAdapter:", error);
  }
})();

export const getServerAuthSession = () => getServerSession(authOptions);
