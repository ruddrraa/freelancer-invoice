import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { env } from "@/lib/env";

export const runtime = "nodejs";

type OpenExchangeResponse = {
  rates?: Record<string, number>;
};

export async function GET(req: NextRequest) {
  try {
    getUserIdOrThrow(req);

    const base = (req.nextUrl.searchParams.get("base") || "INR").toUpperCase();
    const target = (req.nextUrl.searchParams.get("target") || "USD").toUpperCase();

    if (base === target) {
      return ok({ base, target, rate: 1, provider: "openexchangerates" });
    }

    if (!env.OPEN_EXCHANGE_API_KEY) {
      return fail("OPEN_EXCHANGE_API_KEY is missing", 400);
    }

    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${encodeURIComponent(env.OPEN_EXCHANGE_API_KEY)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return fail("Failed to fetch exchange rates", 502);
    }

    const payload = (await response.json()) as OpenExchangeResponse;
    const usdToBase = payload.rates?.[base];
    const usdToTarget = payload.rates?.[target];

    if (!usdToBase || !usdToTarget) {
      return fail("Currency not supported", 422);
    }

    const rate = usdToTarget / usdToBase;
    return ok({ base, target, rate, provider: "openexchangerates" });
  } catch {
    return fail("Unauthorized", 401);
  }
}
