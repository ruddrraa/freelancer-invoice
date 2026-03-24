import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { clientSchema } from "@/lib/validation";
import Client from "@/models/Client";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const client = await Client.findOne({ _id: asObjectId(id), userId });
    if (!client) {
      return fail("Client not found", 404);
    }
    return ok(client);
  } catch (error) {
    return fail(error instanceof Error && error.message === "INVALID_ID" ? "Invalid id" : "Unauthorized", 401);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid client payload", 422, parsed.error.flatten());
    }
    await connectDb();

    const updated = await Client.findOneAndUpdate(
      { _id: asObjectId(id), userId },
      parsed.data,
      { new: true }
    );
    if (!updated) {
      return fail("Client not found", 404);
    }
    return ok(updated);
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await params;
    await connectDb();

    const deleted = await Client.findOneAndDelete({ _id: asObjectId(id), userId });
    if (!deleted) {
      return fail("Client not found", 404);
    }
    return ok({ id: deleted._id });
  } catch {
    return fail("Unauthorized", 401);
  }
}
