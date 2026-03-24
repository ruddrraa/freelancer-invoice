import { NextRequest } from "next/server";
import { fail, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const eventType = body?.event_type;

  if (!eventType) {
    return fail("Invalid PayPal webhook payload", 400);
  }

  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const invoiceId = body?.resource?.custom_id;
    const userId = body?.resource?.invoice_id;
    if (invoiceId && userId) {
      await connectDb();
      await Invoice.findOneAndUpdate({ _id: invoiceId, userId }, { status: "paid", paidAt: new Date() });
      await Payment.create({
        userId,
        invoiceId,
        provider: "paypal",
        providerPaymentId: body?.resource?.id,
        status: "completed",
        amount: Number(body?.resource?.amount?.value || 0),
        currency: String(body?.resource?.amount?.currency_code || "USD"),
        metadata: body,
      });
    }
  }

  return ok({ received: true });
}
