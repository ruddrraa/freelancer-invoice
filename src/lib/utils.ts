import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInvoiceNumber(prefix = "INV") {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${stamp}-${random}`;
}

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function fromCents(amount: number) {
  return amount / 100;
}

export function formatMoney(value: number, currency = "INR") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function sanitizeObject<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== null)
  ) as Partial<T>;
}
