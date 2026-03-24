import QRCode from "qrcode";

type DomesticPaymentInput = {
  upiId?: string;
  amount: number;
  payeeName: string;
  invoiceNumber: string;
};

type InternationalInput = {
  paypalEmail?: string;
  wiseHandle?: string;
  stripePaymentLink?: string;
};

export async function buildDomesticPayment(input: DomesticPaymentInput) {
  if (!input.upiId) {
    return { upiUri: "", qrDataUrl: "" };
  }
  const upiUri = `upi://pay?pa=${encodeURIComponent(input.upiId)}&pn=${encodeURIComponent(
    input.payeeName
  )}&am=${input.amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(input.invoiceNumber)}`;
  const qrDataUrl = await QRCode.toDataURL(upiUri, {
    width: 220,
    margin: 1,
  });
  return { upiUri, qrDataUrl };
}

export function buildInternationalPayment(input: InternationalInput) {
  const paypalLink = input.paypalEmail
    ? `https://www.paypal.com/paypalme/${encodeURIComponent(input.paypalEmail)}`
    : "";
  const wiseLink = input.wiseHandle
    ? `https://wise.com/pay/me/${encodeURIComponent(input.wiseHandle)}`
    : "";
  const stripeLink = input.stripePaymentLink ?? "";

  return { paypalLink, wiseLink, stripeLink };
}
