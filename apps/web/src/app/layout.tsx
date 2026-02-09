import "~/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { ThemeProvider } from "~/components/providers/theme-provider";
import { ServiceWorkerProvider } from "~/components/providers/service-worker-provider";
import { Toaster } from "~/components/ui/sonner";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#32B8C6",
};

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
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("aether-theme")||"dark";var d=t==="system"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t;if(d==="dark")document.documentElement.classList.add("dark")}catch(e){document.documentElement.classList.add("dark")}})()`,
          }}
        />
      </head>
      <body>
        <TRPCReactProvider>
          <ThemeProvider>
            <ServiceWorkerProvider>{children}</ServiceWorkerProvider>
          </ThemeProvider>
        </TRPCReactProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
