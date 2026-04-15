import { LineItemInput, TaxType } from "@/types";

export function isRateBasedTax(taxType: TaxType) {
  return taxType === "percentage" || taxType === "gst" || taxType === "igst" || taxType === "sgst";
}

export function getTaxSummaryLabel(taxType: TaxType, taxValue: number) {
  const safeTaxValue = Math.max(0, taxValue);

  if (taxType === "igst") {
    return `IGST (${safeTaxValue}%)`;
  }

  if (taxType === "sgst") {
    return `SGST (${safeTaxValue}%)`;
  }

  if (taxType === "gst") {
    return `GST (${safeTaxValue}%)`;
  }

  if (taxType === "percentage") {
    return `Tax (${safeTaxValue}%)`;
  }

  return "Tax (Fixed)";
}

export function calculateInvoiceTotals(
  lineItems: LineItemInput[],
  taxType: TaxType,
  taxValue: number
) {
  const subtotal = lineItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
  const normalizedTaxValue = Math.max(0, taxValue);
  const taxAmount =
    isRateBasedTax(taxType) ? subtotal * (normalizedTaxValue / 100) : normalizedTaxValue;
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
