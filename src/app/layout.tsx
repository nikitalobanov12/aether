import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: {
    default: "Aether - Organize Your Goals. Execute Your Day.",
    template: "%s | Aether",
  },
  description:
    "The task planner that syncs calendar, tasks, and life goals in one unified system. AI that helps—not decides for you.",
  keywords: [
    "task planner",
    "goal tracker",
    "calendar sync",
    "productivity",
    "time blocking",
    "daily planner",
  ],
  authors: [{ name: "Aether" }],
  creator: "Aether",
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Aether",
    title: "Aether - Organize Your Goals. Execute Your Day.",
    description:
      "The task planner that syncs calendar, tasks, and life goals in one unified system. AI that helps—not decides for you.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether - Organize Your Goals. Execute Your Day.",
    description:
      "The task planner that syncs calendar, tasks, and life goals in one unified system.",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/logo.svg",
  },
  manifest: "/manifest.json",
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} dark`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
