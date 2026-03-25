import mongoose from "mongoose";
import { env, requireEnv } from "@/lib/env";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const cached = global.mongooseConnection || { conn: null, promise: null };
global.mongooseConnection = cached;

export async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = env.MONGODB_URI ?? requireEnv("MONGODB_URI");
    cached.promise = mongoose.connect(uri, {
      dbName: env.MONGODB_DB_NAME,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
