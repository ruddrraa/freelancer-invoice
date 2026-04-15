export type InvoiceStatus = "pending" | "paid" | "overdue";
export type ClientType = "domestic" | "international";
export type TaxType = "percentage" | "fixed" | "gst" | "igst" | "sgst";

export type LineItemInput = {
  name: string;
  quantity: number;
  price: number;
};

export type InvoiceTotals = {
  subtotal: number;
  taxAmount: number;
  total: number;
};

export type PaymentMethod = {
  type: "upi" | "bank" | "paypal" | "wise" | "stripe";
  label: string;
  value: string;
  isDefault?: boolean;
};
