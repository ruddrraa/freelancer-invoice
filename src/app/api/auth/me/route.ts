import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { decryptSensitive } from "@/lib/crypto";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    await connectDb();
    const user = await User.findById(userId);
    if (!user) {
      return fail("User not found", 404);
    }

    return ok({
      id: String(user._id),
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      logoUrl: user.logoUrl,
      upiId: user.upiId,
      bankDetails: decryptSensitive(user.bankDetailsEncrypted),
      paypalEmail: user.paypalEmail,
      wiseDetails: decryptSensitive(user.wiseDetailsEncrypted),
      stripePaymentLink: user.stripePaymentLink,
      defaultCurrency: user.defaultCurrency,
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
