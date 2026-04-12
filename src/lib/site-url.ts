import { env } from "@/lib/env";

const FALLBACK_SITE_URL = "http://localhost:3000";

function normalizeUrl(url: string | undefined): string {
  if (!url) {
    return "";
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  return (
    normalizeUrl(env.NEXT_PUBLIC_APP_URL) ||
    normalizeUrl(process.env.VERCEL_PROJECT_PRODUCTION_URL) ||
    normalizeUrl(process.env.VERCEL_URL) ||
    FALLBACK_SITE_URL
  );
}
