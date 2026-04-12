import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authCookieName } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  description:
    "RelancePay is a completely free invoice maker to create, send, and track invoices with payment links, PDFs, and client management.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "Free Invoice Maker for Freelancers",
    description:
      "Create branded invoices in minutes with a free online invoice generator built for freelancers and service businesses.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Invoice Maker for Freelancers",
    description:
      "Create and send invoices online for free with RelancePay.",
  },
};

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authCookieName)?.value;
  if (token) {
    redirect("/dashboard");
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "RelancePay",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "A free invoice maker for freelancers to create, send, and track invoices with PDF export and payment links.",
    url: siteUrl,
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "RelancePay",
    url: siteUrl,
    description: "RelancePay provides free online invoicing tools for freelancers and small teams.",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is this invoice maker really free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. RelancePay lets you create and send invoices for free.",
        },
      },
      {
        "@type": "Question",
        name: "Can I download invoices as PDF?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can generate and download professional invoice PDFs from each invoice.",
        },
      },
      {
        "@type": "Question",
        name: "Does it support international clients?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. You can add payment links for Stripe, PayPal, Wise, and domestic UPI details.",
        },
      },
    ],
  };

  return (
    <main className="mono-grid relative min-h-screen overflow-hidden bg-zinc-100 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-5xl">
        <div className="fade-up rounded-3xl border border-zinc-300 bg-white p-10 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] md:p-14">
          <p className="mb-3 inline-flex rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
            RelancePay | 100% Free Invoice Maker
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-zinc-900 md:text-6xl">
            Create professional invoices online for free in under 2 minutes
          </h1>
          <p className="mt-5 max-w-2xl text-zinc-600 md:text-lg">
            RelancePay is a free invoice generator for freelancers, agencies, and small businesses.
            Build branded invoices, attach payment options, send PDF invoices, and track status in one
            dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup">
              <Button size="lg">Create Account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Login
              </Button>
            </Link>
          </div>

          <section className="mt-10 grid gap-4 text-sm text-zinc-700 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-base font-semibold text-zinc-900">Free invoice maker</h2>
              <p className="mt-1">No setup fees and no invoice limits for getting started.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-base font-semibold text-zinc-900">Invoice PDF + email</h2>
              <p className="mt-1">Generate share-ready PDF invoices and deliver them to clients quickly.</p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <h2 className="text-base font-semibold text-zinc-900">Built for global freelancers</h2>
              <p className="mt-1">Support domestic and international payment methods in one workflow.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

