import { NextRequest } from "next/server";
import Stripe from "stripe";
import { fail, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { env } from "@/lib/env";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return fail("Stripe is not configured", 400);
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return fail("Missing stripe signature", 400);
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return fail("Invalid webhook signature", 400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const invoiceId = session.metadata?.invoiceId;
    const userId = session.metadata?.userId;

    if (invoiceId && userId) {
      await connectDb();
      await Invoice.findOneAndUpdate({ _id: invoiceId, userId }, { status: "paid", paidAt: new Date() });
      await Payment.create({
        userId,
        invoiceId,
        provider: "stripe",
        providerPaymentId: session.id,
        status: "completed",
        amount: (session.amount_total ?? 0) / 100,
        currency: (session.currency ?? "usd").toUpperCase(),
        metadata: session,
      });
    }
  }

  return ok({ received: true });
}
