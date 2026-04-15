import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { decryptSensitive } from "@/lib/crypto";
import { sendInvoiceMail } from "@/lib/mail";
import { generateInvoicePdf } from "@/lib/pdf";
import Invoice from "@/models/Invoice";
import User from "@/models/User";
import QRCode from "qrcode";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

function formatInvoiceDate(value: Date) {
  return value.toLocaleDateString("en-GB");
}

async function fetchImageBuffer(url?: string) {
  if (!url) return undefined;
  try {
    const response = await fetch(url);
    if (!response.ok) return undefined;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return undefined;
  }
}

async function buildUpiQrPng(
  upiUri: string,
  upiId: string,
  total: number,
  issuerName: string,
  invoiceNumber: string
) {
  if (!upiUri && !upiId) return undefined;

  const qrSource =
    upiUri ||
    `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(issuerName)}&am=${total.toFixed(
      2
    )}&cu=INR&tn=${encodeURIComponent(invoiceNumber)}`;

  try {
    return await QRCode.toBuffer(qrSource, { type: "png", width: 220, margin: 1 });
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const invoice = await Invoice.findOne({ _id: asObjectId(id), userId });
    if (!invoice) {
      return fail("Invoice not found", 404);
    }
    const user = await User.findById(userId);

    const paymentSnapshot = invoice.paymentDetailsSnapshot || {
      upiId: "",
      upiUri: "",
      bankDetails: "",
      paypalLink: "",
      wiseLink: "",
      stripeLink: "",
    };
    const issuer = invoice.issuerSnapshot || {
      name: "Freelancer",
      companyName: "",
      email: "",
      phone: "",
      address: "",
      logoUrl: "",
    };
    const client = invoice.clientSnapshot || {
      name: "Client",
      email: "",
      phone: "",
      address: "",
    };
    const lineItems = invoice.lineItems || [];
    const issuerLogo = await fetchImageBuffer(issuer.logoUrl);
    const upiQrPng =
      invoice.clientType === "domestic"
        ? await buildUpiQrPng(
            paymentSnapshot.upiUri || "",
            paymentSnapshot.upiId || "",
            invoice.total,
            issuer.name,
            invoice.invoiceNumber
          )
        : undefined;

    const pdfBuffer = await generateInvoicePdf({
      invoiceNumber: invoice.invoiceNumber,
      issueDate: formatInvoiceDate(new Date(invoice.issueDate)),
      dueDate: formatInvoiceDate(new Date(invoice.dueDate)),
      clientType: invoice.clientType,
      issuerName: issuer.name,
      issuerCompanyName: issuer.companyName,
      issuerEmail: issuer.email,
      issuerPhone: issuer.phone,
      issuerAddress: issuer.address,
      issuerLogo,
      clientName: client.name,
      clientEmail: client.email,
      clientPhone: client.phone,
      clientAddress: client.address,
      currency: invoice.currency,
      lineItems,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      taxType: invoice.taxType,
      taxValue: invoice.taxValue,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      paymentDetails:
        invoice.clientType === "domestic"
          ? {
              upiId: paymentSnapshot.upiId,
              bankDetails: paymentSnapshot.bankDetails,
            }
          : {
              paypal: paymentSnapshot.paypalLink,
              wise: paymentSnapshot.wiseLink,
              stripe: paymentSnapshot.stripeLink,
            },
      upiQrPng,
    });

    await sendInvoiceMail({
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${issuer.name}`,
      html: `<p>Hello ${client.name},</p><p>Please find attached invoice <strong>${invoice.invoiceNumber}</strong> for ${invoice.total} ${invoice.currency}.</p><p>Thank you.</p>`,
      pdfBuffer,
      invoiceNumber: invoice.invoiceNumber,
      senderName: issuer.name,
      smtpConfig:
        user?.smtpSenderEmail && user?.smtpAppPasswordEncrypted
          ? {
              email: user.smtpSenderEmail,
              appPassword: decryptSensitive(user.smtpAppPasswordEncrypted),
            }
          : undefined,
    });

    invoice.sentAt = new Date();
    invoice.emailStatus = "sent";
    await invoice.save();

    return ok({ sentAt: invoice.sentAt, emailStatus: invoice.emailStatus });
  } catch (error) {
    if (error instanceof Error && error.message.includes("No SMTP email provider")) {
      return fail(error.message, 400);
    }
    if (error instanceof Error) {
      return fail(error.message, 500);
    }
    return fail("Failed to send invoice", 500);
  }
}
