import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { sendInvoiceMail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";
import Invoice from "@/models/Invoice";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const invoice = await Invoice.findOne({ _id: asObjectId(id), userId });
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

    const pdfBuffer = await generateInvoicePdf({
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

    await sendInvoiceMail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${issuer.name}`,
      html: `<p>Hello ${client.name},</p><p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for ${invoice.total} ${invoice.currency}.</p><p>Thank you.</p>`,
      pdfBuffer,
      invoiceNumber: invoice.invoiceNumber,
    });

    invoice.sentAt = new Date();
    invoice.emailStatus = "sent";
    await invoice.save();

    return ok({ sentAt: invoice.sentAt, emailStatus: invoice.emailStatus });
  } catch (error) {
    if (error instanceof Error && error.message.includes("No email provider")) {
      return fail(error.message, 400);
    }
    return fail("Failed to send invoice", 500);
  }
}
