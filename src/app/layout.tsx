import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "~/components/auth/AuthProvider";
import "highlight.js/styles/github.css";
import "~/styles/globals.css";
import { dbService } from "~/lib/services";
import RegisterPage from "./register/page";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Providers } from "~/providers";
import { seed } from "~/lib/db/seed";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    console.log(
      "Essential seed data (e.g., Administrators group) not found. Running seed script..."
    );
    try {
      await seed();
      console.log("Seed script completed successfully.");
      // Re-check if the group exists now
      adminGroupExists = !!(await dbService.groups.findByName(
        "Administrators"
      ));
      if (!adminGroupExists) {
        console.error(
          "CRITICAL: Seed script ran but Administrators group still not found!"
        );
        // Handle this critical state - maybe return an error component?
      }
    } catch (error) {
      console.error("Failed to run seed script automatically:", error);
      // Handle seeding failure - maybe return an error component?
    }
  }

  // Check user count *after* attempting seed if necessary
  const userCount = await dbService.users.count();
  const isFirstUser = userCount === 0;

  // If there are no users, always redirect to registration
  // This covers the initial setup state correctly.
  if (isFirstUser) {
    console.log("No users found, redirecting to registration.");
    return <RegisterPage />;
  }

  // If users exist, proceed to render the app via AuthProvider
  return <AuthProvider>{children}</AuthProvider>;
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
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background-default text-text-primary overflow-y-hidden`}
      >
        <Providers>
          <Suspense fallback={<Skeleton className="w-full h-full" />}>
            <RootLayoutContent>{children}</RootLayoutContent>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
