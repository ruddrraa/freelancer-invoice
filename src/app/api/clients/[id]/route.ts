import { NextRequest } from "next/server";
import { asObjectId, fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { clientSchema } from "@/lib/validation";
import Client from "@/models/Client";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await context.params;
    await connectDb();

    const client = await Client.findOne({ _id: asObjectId(id), userId });
    if (!client) {
      return fail("Client not found", 404);
    }

    return ok(client);
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return fail("Invalid id", 400);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    return fail("Failed to fetch client", 500);
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await context.params;
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
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return fail("Invalid id", 400);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    return fail("Failed to update client", 500);
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const userId = getUserIdOrThrow(req);
    const { id } = await context.params;
    await connectDb();

    const deleted = await Client.findOneAndDelete({ _id: asObjectId(id), userId });
    if (!deleted) {
      return fail("Client not found", 404);
    }

    return ok({ id: deleted._id });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return fail("Invalid id", 400);
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return fail("Unauthorized", 401);
    }
    return fail("Failed to delete client", 500);
  }
}
