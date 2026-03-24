import { formatMoney } from "@/lib/utils";

type PreviewProps = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  clientName: string;
  issuerName: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  paymentDetails: {
    upiId?: string;
    paypal?: string;
    wise?: string;
    stripe?: string;
  };
};

export function InvoicePreview(props: PreviewProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">Invoice Preview</h3>
          <p className="text-sm text-slate-500">#{props.invoiceNumber || "Draft"}</p>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p>Issue: {props.issueDate || "-"}</p>
          <p>Due: {props.dueDate || "-"}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-2 text-sm md:grid-cols-2">
        <div>
          <p className="text-slate-500">Billed To</p>
          <p className="font-medium">{props.clientName || "Client name"}</p>
        </div>
        <div>
          <p className="text-slate-500">Issued By</p>
          <p className="font-medium">{props.issuerName || "Your profile"}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {props.lineItems.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="grid grid-cols-[1fr_120px] gap-2">
            <span>{item.name || `Item ${idx + 1}`}</span>
            <span className="text-right">
              {item.quantity} x {formatMoney(item.price, props.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-slate-200 pt-3 text-sm">
        <p className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(props.subtotal, props.currency)}</span>
        </p>
        <p className="flex justify-between">
          <span>Tax</span>
          <span>{formatMoney(props.taxAmount, props.currency)}</span>
        </p>
        <p className="mt-1 flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(props.total, props.currency)}</span>
        </p>
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
        <p className="mb-1 font-semibold text-slate-800">Payment Methods</p>
        {props.paymentDetails.upiId && <p>UPI: {props.paymentDetails.upiId}</p>}
        {props.paymentDetails.paypal && <p>PayPal: {props.paymentDetails.paypal}</p>}
        {props.paymentDetails.wise && <p>Wise: {props.paymentDetails.wise}</p>}
        {props.paymentDetails.stripe && <p>Stripe: {props.paymentDetails.stripe}</p>}
      </div>
    </div>
  );
}
