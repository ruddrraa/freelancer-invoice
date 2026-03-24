import { NextRequest, NextResponse } from "next/server";
import { asObjectId, fail, getUserIdOrThrow } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf";
import Invoice from "@/models/Invoice";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const invoice = await Invoice.findOne({ _id: asObjectId(id), userId }).lean();
    if (!invoice) {
      return fail("Invoice not found", 404);
    }

    const paymentSnapshot = invoice.paymentDetailsSnapshot || {
      upiId: "",
      bankDetails: "",
      paypalLink: "",
      wiseLink: "",
      stripeLink: "",
    };
    const issuer = invoice.issuerSnapshot || {
      name: "Freelancer",
      email: "",
    };
    const client = invoice.clientSnapshot || {
      name: "Client",
      email: "",
    };
    const lineItems = invoice.lineItems || [];

    const paymentDetails = [
      paymentSnapshot.upiId
        ? `UPI: ${paymentSnapshot.upiId}`
        : "",
      paymentSnapshot.bankDetails
        ? `Bank: ${paymentSnapshot.bankDetails}`
        : "",
      paymentSnapshot.paypalLink
        ? `PayPal: ${paymentSnapshot.paypalLink}`
        : "",
      paymentSnapshot.wiseLink
        ? `Wise: ${paymentSnapshot.wiseLink}`
        : "",
      paymentSnapshot.stripeLink
        ? `Stripe: ${paymentSnapshot.stripeLink}`
        : "",
    ].filter(Boolean);

    const buffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: new Date(invoice.issueDate).toLocaleDateString(),
      dueDate: new Date(invoice.dueDate).toLocaleDateString(),
      issuerName: issuer.name,
      issuerEmail: issuer.email,
      clientName: client.name,
      clientEmail: client.email,
      currency: invoice.currency,
      lineItems,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      total: invoice.total,
      notes: invoice.notes,
      paymentDetails,
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
