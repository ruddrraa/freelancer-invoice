import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { calculateInvoiceTotals, deriveInvoiceStatus } from "@/lib/invoice";
import { invoiceSchema } from "@/lib/validation";
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
    return ok(invoice);
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = invoiceSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid invoice payload", 422, parsed.error.flatten());
    }

    await connectDb();
    const totals = calculateInvoiceTotals(
      parsed.data.lineItems,
      parsed.data.taxType,
      parsed.data.taxValue
    );
    const dueDate = new Date(parsed.data.dueDate);

    const invoice = await Invoice.findOneAndUpdate(
      { _id: asObjectId(id), userId },
      {
        invoiceNumber: parsed.data.invoiceNumber,
        issueDate: new Date(parsed.data.issueDate),
        dueDate,
        clientType: parsed.data.clientType,
        clientSnapshot: parsed.data.clientSnapshot,
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
      },
      { new: true }
    );

    if (!invoice) {
      return fail("Invoice not found", 404);
    }
    return ok(invoice);
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const deleted = await Invoice.findOneAndDelete({ _id: asObjectId(id), userId });
    if (!deleted) {
      return fail("Invoice not found", 404);
    }
    return ok({ id: deleted._id });
  } catch {
    return fail("Unauthorized", 401);
  }
}
