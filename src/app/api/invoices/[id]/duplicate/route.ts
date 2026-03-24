import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { generateInvoiceNumber } from "@/lib/utils";
import Invoice from "@/models/Invoice";

export const runtime = "nodejs";
type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const source = await Invoice.findOne({ _id: asObjectId(id), userId }).lean();
    if (!source) {
      return fail("Invoice not found", 404);
    }

    const duplicated = await Invoice.create({
      ...source,
      _id: undefined,
      invoiceNumber: generateInvoiceNumber(),
      status: "pending",
      paidAt: null,
      sentAt: null,
      emailStatus: "not_sent",
      createdAt: undefined,
      updatedAt: undefined,
    });

    return ok(duplicated, 201);
  } catch {
    return fail("Unauthorized", 401);
  }
}
