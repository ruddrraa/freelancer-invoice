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
      companyName: user.companyName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      logoUrl: user.logoUrl,
      signatureUrl: user.signatureUrl,
      upiId: user.upiId,
      bankDetails: decryptSensitive(user.bankDetailsEncrypted),
      paypalEmail: user.paypalEmail,
      wiseDetails: decryptSensitive(user.wiseDetailsEncrypted),
      stripePaymentLink: user.stripePaymentLink,
      smtpSenderEmail: user.smtpSenderEmail,
      smtpAppPassword: "",
      smtpConfigured: Boolean(user.smtpSenderEmail && user.smtpAppPasswordEncrypted),
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

    const user = await User.findById(userId);
    if (!user) {
      return fail("User not found", 404);
    }

    user.name = parsed.data.name;
    user.companyName = parsed.data.companyName || "";
    user.phone = parsed.data.phone || "";
    user.address = parsed.data.address || "";
    user.logoUrl = parsed.data.logoUrl || "";
    user.signatureUrl = parsed.data.signatureUrl || "";
    user.upiId = parsed.data.upiId || "";
    user.bankDetailsEncrypted = encryptSensitive(parsed.data.bankDetails || "");
    user.paypalEmail = parsed.data.paypalEmail || "";
    user.wiseDetailsEncrypted = encryptSensitive(parsed.data.wiseDetails || "");
    user.stripePaymentLink = parsed.data.stripePaymentLink || "";
    user.smtpSenderEmail = parsed.data.smtpSenderEmail || "";
    user.defaultCurrency = parsed.data.defaultCurrency;

    if (parsed.data.smtpAppPassword) {
      user.smtpAppPasswordEncrypted = encryptSensitive(parsed.data.smtpAppPassword);
    } else if (!user.smtpSenderEmail) {
      user.smtpAppPasswordEncrypted = "";
    }

    const updated = await user.save();

    if (!updated) {
      return fail("User not found", 404);
    }

    return ok({
      id: String(updated._id),
      name: updated.name,
      companyName: updated.companyName,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      logoUrl: updated.logoUrl,
      signatureUrl: updated.signatureUrl,
      upiId: updated.upiId,
      bankDetails: decryptSensitive(updated.bankDetailsEncrypted),
      paypalEmail: updated.paypalEmail,
      wiseDetails: decryptSensitive(updated.wiseDetailsEncrypted),
      stripePaymentLink: updated.stripePaymentLink,
      smtpSenderEmail: updated.smtpSenderEmail,
      smtpAppPassword: "",
      smtpConfigured: Boolean(updated.smtpSenderEmail && updated.smtpAppPasswordEncrypted),
      defaultCurrency: updated.defaultCurrency,
    });
  } catch {
    return fail("Unauthorized", 401);
  }
}
