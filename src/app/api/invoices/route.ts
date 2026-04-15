import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { logActivity } from "@/lib/activity";
import { connectDb } from "@/lib/db";
import { decryptSensitive } from "@/lib/crypto";
import { calculateInvoiceTotals, deriveInvoiceStatus } from "@/lib/invoice";
import { buildDomesticPayment, buildInternationalPayment } from "@/lib/payments";
import { generateInvoiceNumber } from "@/lib/utils";
import { invoiceSchema } from "@/lib/validation";
import Client from "@/models/Client";
import Invoice from "@/models/Invoice";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    await connectDb();

    const search = req.nextUrl.searchParams.get("search") ?? "";
    const status = req.nextUrl.searchParams.get("status") ?? "";
    const client = req.nextUrl.searchParams.get("client") ?? "";
    const page = Number(req.nextUrl.searchParams.get("page") ?? "1");
    const limit = Math.min(50, Number(req.nextUrl.searchParams.get("limit") ?? "10"));
    const skip = (Math.max(page, 1) - 1) * limit;

    const query: Record<string, unknown> = { userId: asObjectId(userId) };

    if (status && ["pending", "paid", "overdue"].includes(status)) {
      query.status = status;
    }

    if (client) {
      query["clientSnapshot.name"] = { $regex: client, $options: "i" };
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { "clientSnapshot.name": { $regex: search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Invoice.countDocuments(query),
    ]);

    return ok({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    const body = await req.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid invoice payload", 422, parsed.error.flatten());
    }

    await connectDb();
    const user = await User.findById(userId);
    if (!user) {
      return fail("User not found", 404);
    }

    const totals = calculateInvoiceTotals(
      parsed.data.lineItems,
      parsed.data.taxType,
      parsed.data.taxValue
    );

    const invoiceNumber = parsed.data.invoiceNumber || generateInvoiceNumber();
    const dueDate = new Date(parsed.data.dueDate);

    let clientId = undefined;
    if (parsed.data.clientId) {
      const client = await Client.findOne({ _id: asObjectId(parsed.data.clientId), userId });
      if (!client) {
        return fail("Client not found", 404);
      }
      clientId = client._id;
    }

    const domestic = await buildDomesticPayment({
      upiId: user.upiId,
      amount: totals.total,
      payeeName: user.name,
      invoiceNumber,
    });
    const intl = buildInternationalPayment({
      paypalEmail: user.paypalEmail,
      wiseHandle: decryptSensitive(user.wiseDetailsEncrypted),
      stripePaymentLink: user.stripePaymentLink,
    });

    const invoice = await Invoice.create({
      userId,
      clientId,
      invoiceNumber,
      issueDate: new Date(parsed.data.issueDate),
      dueDate,
      clientType: parsed.data.clientType,
      clientSnapshot: parsed.data.clientSnapshot,
      issuerSnapshot: {
        name: user.name,
        companyName: user.companyName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        logoUrl: user.logoUrl,
        signatureUrl: user.signatureUrl,
      },
      lineItems: parsed.data.lineItems,
      taxType: parsed.data.taxType,
      taxValue: parsed.data.taxValue,
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      currency: parsed.data.currency,
      notes: parsed.data.notes || "",
      terms: parsed.data.terms || "",
      status: deriveInvoiceStatus(dueDate),
      paymentDetailsSnapshot: {
        upiId: user.upiId,
        upiUri: domestic.upiUri,
        bankDetails: decryptSensitive(user.bankDetailsEncrypted),
        paypalLink: intl.paypalLink,
        wiseLink: intl.wiseLink,
        stripeLink: intl.stripeLink,
      },
    });

    await logActivity(userId, "invoice_created", "invoice", String(invoice._id), {
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
    });

    return ok(invoice, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes("E11000")) {
      return fail("Invoice number already exists", 409);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    if (error instanceof Error) {
      return fail(error.message || "Failed to create invoice", 500);
    }
    return fail("Failed to create invoice", 500);
  }
}
