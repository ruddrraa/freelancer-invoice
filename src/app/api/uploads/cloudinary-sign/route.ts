import { NextRequest } from "next/server";
import { fail, getUserIdOrThrow, ok } from "@/lib/api";
import { cloudinaryUploadSignature } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdOrThrow(req);
    const signature = cloudinaryUploadSignature(`freelancer-invoice/${userId}`);
    return ok(signature);
  } catch (error) {
    if (error instanceof Error && error.message.includes("Cloudinary")) {
      return fail(error.message, 400);
    }
    return fail("Unauthorized", 401);
  }
}
