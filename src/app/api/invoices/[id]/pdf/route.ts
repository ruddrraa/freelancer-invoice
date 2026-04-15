import { NextRequest, NextResponse } from "next/server";
import { asObjectId, fail, getUserIdOrThrow } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateInvoicePdf } from "@/lib/pdf";
import Invoice from "@/models/Invoice";
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

    const buffer = await generateInvoicePdf({
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
