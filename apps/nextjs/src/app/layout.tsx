import { ClerkProvider } from "@clerk/nextjs";
import { Inter as FontSans } from "next/font/google";
import localFont from "next/font/local";

import "~/styles/globals.css";

import { NextDevtoolsProvider } from "@next-devtools/core";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { cn } from "@saasfly/ui";
import { Toaster } from "@saasfly/ui/toaster";

import { TailwindIndicator } from "~/components/tailwind-indicator";
import { ThemeProvider } from "~/components/theme-provider";
import { i18n } from "~/config/i18n-config";
import { siteConfig } from "~/config/site";

// import { Suspense } from "react";
// import { PostHogPageview } from "~/config/providers";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

// Font files can be colocated inside of `pages`
const fontHeading = localFont({
  src: "../styles/fonts/CalSans-SemiBold.woff2",
  variable: "--font-heading",
});

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export const metadata = {
  title: {
    default: "Koment | Event Management & Esports Tournament Engine",
    template: `%s | Koment`,
  },
  description:
    "The all-in-one SaaS platform for hosting physical and virtual events, automated single & double elimination esports brackets, custom registration forms, and instant QR check-in.",
  keywords: [
    "Koment",
    "Esports Tournament Maker",
    "Tournament Bracket Generator",
    "Event Management SaaS",
    "LAN Party Organizer",
    "Single Elimination Bracket",
    "Double Elimination Bracket",
    "QR Code Event Check-in",
    "Live Esports Scoring",
    "Gaming Competitions",
    "Event Ticketing Platform",
    "Valorant Tournament",
    "CS2 Tournament",
    "League of Legends Tournament",
  ],
  authors: [
    {
      name: "koamishin",
      url: "https://github.com/koamishin",
    },
    {
      name: "Koment Team",
      url: "https://github.com/koamishin/koment",
    },
  ],
  creator: "Koment",
  publisher: "koamishin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "Koment | Event Management & Esports Tournament Engine",
    description:
      "Host esports championships, manage live single & double elimination brackets, handle attendee registrations, and automate door QR check-in.",
    siteName: "Koment",
    images: [
      {
        url: `${siteConfig.url}/og.png`,
        width: 1200,
        height: 630,
        alt: "Koment - Event Management & Esports Tournament Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Koment | Event Management & Esports Tournament Engine",
    description:
      "Host esports championships, manage live single & double elimination brackets, handle attendee registrations, and automate door QR check-in.",
    images: [`${siteConfig.url}/og.png`],
    creator: "@koment_gg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/logo.svg",
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(siteConfig.url),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const publishableKey =
    envKey && (envKey.startsWith("pk_test_") || envKey.startsWith("pk_live_")) && envKey.length > 20
      ? envKey
      : "pk_test_bW9jay1jbGVyay1pbnN0YW5jZS5hY2NvdW50cy5kZXYk";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en" suppressHydrationWarning>
        <head />
        {/*<Suspense>*/}
        {/*  <PostHogPageview />*/}
        {/*</Suspense>*/}
        <body
          className={cn(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable,
            fontHeading.variable,
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
          >
            <NextDevtoolsProvider>{children}</NextDevtoolsProvider>
            <Analytics />
            <SpeedInsights />
            <Toaster />
            <TailwindIndicator />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
