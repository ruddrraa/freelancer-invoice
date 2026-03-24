import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDb } from "@/lib/db";
import Invoice from "@/models/Invoice";
import Payment from "@/models/Payment";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const invoice = await Invoice.findOneAndUpdate(
      { _id: asObjectId(id), userId },
      { status: "paid", paidAt: new Date() },
      { new: true }
    );
    if (!invoice) {
      return fail("Invoice not found", 404);
    }

    await Payment.create({
      userId,
      invoiceId: invoice._id,
      provider: "manual",
      status: "completed",
      amount: invoice.total,
      currency: invoice.currency,
      metadata: { source: "manual_mark_paid" },
    });

    await logActivity(userId, "invoice_paid_manual", "invoice", String(invoice._id));
    return ok(invoice);
  } catch {
    return fail("Unauthorized", 401);
  }
}
