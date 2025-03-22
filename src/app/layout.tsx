import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TRPCProvider } from "~/lib/trpc/providers";
import { AuthProvider } from "~/components/auth/AuthProvider";
import "highlight.js/styles/github.css";
import "~/styles/globals.css";

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
        <AuthProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
