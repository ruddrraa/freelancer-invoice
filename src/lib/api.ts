import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getAuthPayload } from "@/lib/auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
    },
    { status }
  );
}

export function getUserIdOrThrow(req: NextRequest) {
  const auth = getAuthPayload(req);
  if (!auth?.userId) {
    throw new Error("UNAUTHORIZED");
  }
  return auth.userId;
}

export function asObjectId(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("INVALID_ID");
  }
  return new mongoose.Types.ObjectId(id);
}
