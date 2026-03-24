import crypto from "crypto";
import { env } from "@/lib/env";

function getKey() {
  const raw = env.ENCRYPTION_KEY;
  if (!raw) {
    return null;
  }
  return crypto.createHash("sha256").update(raw).digest();
}

export function encryptSensitive(plaintext?: string) {
  if (!plaintext) {
    return "";
  }
  const key = getKey();
  if (!key) {
    return plaintext;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSensitive(payload?: string) {
  if (!payload) {
    return "";
  }
  const key = getKey();
  if (!key || !payload.includes(":")) {
    return payload;
  }

  const [ivHex, authTagHex, encryptedHex] = payload.split(":");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
