import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Invoice Maker - Free Online Invoice Generator",
  description:
    "Use RelancePay's free invoice maker to create professional invoices online with taxes, line items, payment links, and PDF download.",
  alternates: {
    canonical: "/invoice-maker",
  },
  openGraph: {
    title: "Invoice Maker - Free Online Invoice Generator",
    description:
      "Create and send professional invoices online for free with RelancePay.",
    url: "/invoice-maker",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoice Maker - Free Online Invoice Generator",
    description: "Create and send invoices online for free with RelancePay.",
  },
};

export default function InvoiceMakerPage() {
  return (
    <main className="mono-grid min-h-screen bg-zinc-100 px-6 py-12">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-zinc-300 bg-white p-8 shadow-[0_24px_60px_-40px_rgba(0,0,0,0.9)] md:p-12">
        <p className="inline-flex rounded-full border border-zinc-300 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700">
          Free Invoice Generator
        </p>

        <h1 className="mt-4 text-3xl font-bold leading-tight text-zinc-900 md:text-5xl">
          Free invoice maker for freelancers and small businesses
        </h1>

        <p className="mt-4 text-zinc-700 md:text-lg">
          RelancePay helps you create branded invoices, add tax and line items, include payment options,
          and export PDF invoices. It is designed to be fast, clean, and easy for client billing.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">Why use this invoice maker?</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>Create invoices in minutes with reusable client data</li>
              <li>Accept domestic and international payment methods</li>
              <li>Download and email professional invoice PDFs</li>
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">Best for</h2>
            <ul className="mt-3 space-y-2 text-sm text-zinc-700">
              <li>Freelancers billing monthly retainers</li>
              <li>Designers, developers, and consultants</li>
              <li>Agencies managing multiple recurring clients</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/signup">
            <Button size="lg">Start Free</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary" size="lg">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
