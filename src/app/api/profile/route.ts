import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { connectDb } from "@/lib/db";
import { decryptSensitive, encryptSensitive } from "@/lib/crypto";
import { profileSchema } from "@/lib/validation";
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

export async function PUT(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    const body = await req.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid profile payload", 422, parsed.error.flatten());
    }

    await connectDb();

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        name: parsed.data.name,
        phone: parsed.data.phone || "",
        address: parsed.data.address || "",
        logoUrl: parsed.data.logoUrl || "",
        upiId: parsed.data.upiId || "",
        bankDetailsEncrypted: encryptSensitive(parsed.data.bankDetails || ""),
        paypalEmail: parsed.data.paypalEmail || "",
        wiseDetailsEncrypted: encryptSensitive(parsed.data.wiseDetails || ""),
        stripePaymentLink: parsed.data.stripePaymentLink || "",
        defaultCurrency: parsed.data.defaultCurrency,
      },
      { new: true }
    );

    if (!updated) {
      return fail("User not found", 404);
    }

    return ok({
      id: String(updated._id),
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      logoUrl: updated.logoUrl,
      upiId: updated.upiId,
      bankDetails: decryptSensitive(updated.bankDetailsEncrypted),
      paypalEmail: updated.paypalEmail,
      wiseDetails: decryptSensitive(updated.wiseDetailsEncrypted),
      stripePaymentLink: updated.stripePaymentLink,
      defaultCurrency: updated.defaultCurrency,
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
