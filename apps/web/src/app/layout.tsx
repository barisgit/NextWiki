import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "highlight.js/styles/github.css";
import "~/styles/globals.css";
import { dbService } from "~/lib/services";
import RegisterPage from "./(auth)/register/page";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Providers } from "~/providers";
import { seed } from "~/lib/db/seed";
import { PermissionGate } from "~/components/auth/permission/server";
import { LogOutButton } from "~/components/auth/LogOutButton";
import { logger } from "~/lib/utils/logger";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NextWiki - Modern Wiki for Next.js",
  description:
    "An open-source wiki system built with Next.js, Drizzle, tRPC, and NextAuth",
};

async function RootLayoutContent({ children }: { children: React.ReactNode }) {
  let adminGroupExists = !!(await dbService.groups.findByName(
    "Administrators"
  ));

  // Attempt seeding only if the admin group doesn't exist
  if (!adminGroupExists) {
    logger.log(
      "Essential seed data (e.g., Administrators group) not found. Running seed script..."
    );
    try {
      await seed();
      logger.log("Seed script completed successfully.");
      // Re-check if the group exists now
      adminGroupExists = !!(await dbService.groups.findByName(
        "Administrators"
      ));
      if (!adminGroupExists) {
        logger.error(
          "CRITICAL: Seed script ran but Administrators group still not found!"
        );
        // Handle this critical state - maybe return an error component?
      }
    } catch (error) {
      logger.error("Failed to run seed script automatically:", error);
      // Handle seeding failure - maybe return an error component?
    }
  }

  // Check user count *after* attempting seed if necessary
  const userCount = await dbService.users.count();
  const isFirstUser = userCount === 0;

  if (isFirstUser) {
    logger.log(
      "No users found, directing to registration within RootLayoutContent."
    );
    return <RegisterPage isFirstUser={true} />;
  }

  // Normal case: Wrap children in AuthProvider for session context
  return children;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Add blocking style first
                  document.documentElement.style.visibility = 'hidden';
                  
                  var theme = localStorage.getItem('theme') || 'system';
                  var isDark = theme === 'dark' || 
                    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Set data attribute for potential CSS targeting
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  
                  // Make visible again after theme is applied
                  document.documentElement.style.visibility = '';
                } catch (e) {
                  // Make sure visibility is always restored
                  document.documentElement.style.visibility = '';
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background-default text-text-primary overflow-y-hidden`}
      >
        <Providers>
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <PermissionGate
              permission="wiki:page:read"
              publicPaths={["/login", "/register", "/api/*"]}
              allowGuests={true}
            >
              <PermissionGate.Authorized>
                <RootLayoutContent>{children}</RootLayoutContent>
              </PermissionGate.Authorized>
              <PermissionGate.Unauthorized>
                <div className="flex items-center justify-center w-full h-screen">
                  <div className="p-8 text-center rounded-lg shadow-md bg-red-50 dark:bg-red-900/20">
                    <h2 className="mb-4 text-2xl font-bold text-red-500">
                      Access Denied
                    </h2>
                    <p>You do not have permission to access this wiki.</p>
                    <p className="mt-2">
                      Please contact an administrator for access.
                    </p>
                    <div className="flex justify-center mt-4">
                      <LogOutButton />
                    </div>
                  </div>
                </div>
              </PermissionGate.Unauthorized>
              <PermissionGate.NotLoggedIn redirectTo="/login">
                <div className="flex items-center justify-center w-full h-screen">
                  <div className="p-8 text-center rounded-lg shadow-md bg-accent-50 dark:bg-accent-900/20">
                    <h2 className="text-2xl font-bold text-accent-500">
                      Redirecting to login page
                    </h2>
                  </div>
                </div>
              </PermissionGate.NotLoggedIn>
            </PermissionGate>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
