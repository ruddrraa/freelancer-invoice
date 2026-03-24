import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { clientSchema } from "@/lib/validation";
import Client from "@/models/Client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    await connectDb();

    const clients = await Client.find({ userId }).sort({ createdAt: -1 }).lean();
    return ok(clients);
  } catch {
    return fail("Unauthorized", 401);
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    const body = await req.json();
    const parsed = clientSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid client payload", 422, parsed.error.flatten());
    }

    await connectDb();
    const created = await Client.create({
      userId,
      ...parsed.data,
    });

    return ok(created, 201);
  } catch {
    return fail("Unauthorized", 401);
  }
}
