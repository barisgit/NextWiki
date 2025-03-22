import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "~/lib/trpc/providers";
import { AuthProvider } from "~/components/auth/AuthProvider";
import { ModalProvider } from "~/components/ui/modal-provider";
import { Toaster } from "sonner";
import "highlight.js/styles/github.css";
import "~/styles/globals.css";
import { dbService } from "~/lib/services";
import RegisterPage from "./register/page";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";

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
  const userCount = await dbService.users.count();
  const isFirstUser = userCount === 0;

  if (isFirstUser) {
    return <RegisterPage />;
  }

  return <AuthProvider>{children}</AuthProvider>;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TRPCProvider>
          <ModalProvider>
            <Suspense fallback={<Skeleton className="w-full h-full" />}>
              <RootLayoutContent>{children}</RootLayoutContent>
            </Suspense>
            <Toaster
              position="top-center"
              closeButton
              expand
              visibleToasts={3}
              richColors
              toastOptions={{
                duration: 3000,
                style: {
                  border: "0px",
                },
              }}
            />
          </ModalProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
