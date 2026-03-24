import { LineItemInput, TaxType } from "@/types";

export function calculateInvoiceTotals(
  lineItems: LineItemInput[],
  taxType: TaxType,
  taxValue: number
) {
  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const taxAmount =
    taxType === "percentage" ? subtotal * (Math.max(0, taxValue) / 100) : Math.max(0, taxValue);
  const total = subtotal + taxAmount;

  return {
    subtotal,
    taxAmount,
    total,
  };
}

export function deriveInvoiceStatus(dueDate: Date, paidAt?: Date | null) {
  if (paidAt) {
    return "paid";
  }
  return dueDate.getTime() < Date.now() ? "overdue" : "pending";
}
