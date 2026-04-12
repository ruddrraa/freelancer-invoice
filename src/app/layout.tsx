import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import { env } from "@/lib/env";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const heading = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: "RelancePay",
  title: {
    default: "RelancePay | Free Invoice",
    template: "%s | RelancePay",
  },
  icons: {
    icon: "/RelancePayLogo.png?v=2",
    shortcut: "/RelancePayLogo.png?v=2",
    apple: "/RelancePayLogo.png?v=2",
  },
  description:
    "Create and send professional invoices in seconds with a completely free invoice maker for freelancers and small businesses.",
  keywords: [
    "invoice maker",
    "free invoice maker",
    "invoice generator",
    "relancepay",
    "online invoice software",
    "free invoicing tool",
    "create invoice online",
    "freelancer billing software",
  ],
  creator: "RelancePay",
  publisher: "RelancePay",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "RelancePay",
    title: "Free Invoice Maker for Freelancers | RelancePay",
    description:
      "A free invoice maker to create, send, and track professional invoices with payment links and PDF export.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Invoice Maker for Freelancers | RelancePay",
    description:
      "Create and send professional invoices online for free. Built for freelancers and small businesses.",
  },
  verification: {
    google: env.GOOGLE_SITE_VERIFICATION,
    other: env.BING_SITE_VERIFICATION ? { "msvalidate.01": env.BING_SITE_VERIFICATION } : undefined,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sans.variable} ${heading.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
