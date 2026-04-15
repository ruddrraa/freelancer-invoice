import { getTaxSummaryLabel } from "@/lib/invoice";
import { TaxType } from "@/types";

function formatInvoiceMoney(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency} ${formatted}`;
}

function formatInvoiceDate(value: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB");
}

type PreviewProps = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  currency: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  issuerName: string;
  issuerCompanyName?: string;
  issuerEmail?: string;
  issuerPhone?: string;
  issuerAddress?: string;
  issuerLogoUrl?: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  taxType: TaxType;
  taxValue: number;
  total: number;
  clientType: "domestic" | "international";
  paymentDetails: {
    upiId?: string;
    bankDetails?: string;
    paypal?: string;
    wise?: string;
    stripe?: string;
  };
  notes?: string;
  terms?: string;
};

export function InvoicePreview(props: PreviewProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-zinc-900 font-[Helvetica]">
      <div className="mb-4 flex items-end justify-between border-b border-zinc-200 pb-3">
        <div>
          {props.issuerLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={props.issuerLogoUrl}
              alt="Issuer logo"
              className="mb-2 h-8 w-auto rounded-md object-cover"
            />
          ) : (
            <div className="mb-2 grid h-8 w-8 place-items-center rounded-md bg-zinc-900 text-xs font-bold text-white">
              FI
            </div>
          )}
          <h3 className="text-2xl font-bold tracking-tight">Invoice</h3>
        </div>
        <div className="text-right text-[11px] text-zinc-600">
          <p className="font-semibold">Invoice no.</p>
          <p className="font-semibold text-zinc-800">{props.invoiceNumber || "DRAFT"}</p>
          <p className="mt-2 font-semibold">Issue date</p>
          <p className="font-semibold text-zinc-800">{formatInvoiceDate(props.issueDate)}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 text-xs md:grid-cols-2">
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Billed to</p>
          <p className="font-semibold">{props.clientName || "Client name"}</p>
          {props.clientEmail ? <p className="text-[11px] text-zinc-500">{props.clientEmail}</p> : null}
          {props.clientPhone ? <p className="text-[11px] text-zinc-500">{props.clientPhone}</p> : null}
          {props.clientAddress ? (
            <p className="text-[11px] text-zinc-500 whitespace-pre-line">{props.clientAddress}</p>
          ) : null}
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Issued by</p>
          {props.issuerCompanyName ? <p className="font-semibold">{props.issuerCompanyName}</p> : null}
          <p className="font-semibold">{props.issuerName || "Your profile"}</p>
          {props.issuerEmail ? <p className="text-[11px] text-zinc-500">{props.issuerEmail}</p> : null}
          {props.issuerPhone ? <p className="text-[11px] text-zinc-500">{props.issuerPhone}</p> : null}
          {props.issuerAddress ? (
            <p className="text-[11px] text-zinc-500 whitespace-pre-line">{props.issuerAddress}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-4 border-b border-zinc-200 pb-3">
        <p className="text-xl font-semibold">
          {formatInvoiceMoney(props.total, props.currency)} due by {formatInvoiceDate(props.dueDate)}
        </p>
      </div>

      <div className="text-xs">
        <div className="grid grid-cols-[1.6fr_0.6fr_0.9fr_0.9fr] border-b border-zinc-200 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
          <p>Product or service</p>
          <p className="text-right">Qty</p>
          <p className="text-right">Unit price</p>
          <p className="text-right">Total</p>
        </div>
        {props.lineItems.map((item, idx) => (
          <div
            key={`${item.name}-${idx}`}
            className="grid grid-cols-[1.6fr_0.6fr_0.9fr_0.9fr] border-b border-zinc-100 py-2"
          >
            <p>{item.name || `Line Item ${idx + 1}`}</p>
            <p className="text-right">{item.quantity}</p>
            <p className="text-right">{formatInvoiceMoney(item.price, props.currency)}</p>
            <p className="text-right">{formatInvoiceMoney(item.quantity * item.price, props.currency)}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 ml-auto max-w-xs space-y-1 text-xs">
        <p className="flex justify-between text-zinc-600">
          <span>Total excluding tax</span>
          <span>{formatInvoiceMoney(props.subtotal, props.currency)}</span>
        </p>
        <p className="flex justify-between text-zinc-600">
          <span>{getTaxSummaryLabel(props.taxType, props.taxValue)}</span>
          <span>{formatInvoiceMoney(props.taxAmount, props.currency)}</span>
        </p>
        <p className="flex justify-between border-t border-zinc-200 pt-2 text-base font-semibold">
          <span>Amount Due</span>
          <span>{formatInvoiceMoney(props.total, props.currency)}</span>
        </p>
      </div>

      <div className="mt-4 border-t border-zinc-200 pt-3 text-[11px]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide">Ways to pay</p>
        {props.clientType === "domestic" ? (
          <div className="space-y-1">
            {props.paymentDetails.upiId ? <p>UPI: {props.paymentDetails.upiId}</p> : <p>UPI ID not added</p>}
            {props.paymentDetails.bankDetails ? (
              <p className="whitespace-pre-line">Bank account: {props.paymentDetails.bankDetails}</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-1">
            {props.paymentDetails.paypal ? <p>PayPal: {props.paymentDetails.paypal}</p> : null}
            {props.paymentDetails.wise ? <p>Wise: {props.paymentDetails.wise}</p> : null}
            {props.paymentDetails.stripe ? <p>Stripe: {props.paymentDetails.stripe}</p> : null}
          </div>
        )}
      </div>

      {props.notes ? (
        <div className="mt-4 text-[11px]">
          <p className="text-xs font-semibold uppercase tracking-wide">Notes</p>
          <p className="mt-1 whitespace-pre-line text-zinc-600">{props.notes}</p>
        </div>
      ) : null}

      {props.terms ? (
        <div className="mt-4 text-[11px]">
          <p className="text-xs font-semibold uppercase tracking-wide">Terms</p>
          <p className="mt-1 whitespace-pre-line text-zinc-600">{props.terms}</p>
        </div>
      ) : null}
    </div>
  );
}
