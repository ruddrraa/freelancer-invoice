import PDFDocument from "pdfkit";
import { formatMoney } from "@/lib/utils";

type PdfPayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  issuerName: string;
  issuerEmail: string;
  clientName: string;
  clientEmail: string;
  currency: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes?: string;
  paymentDetails: string[];
};

export function generateInvoicePdf(payload: PdfPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(22).text("Invoice", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Invoice #${payload.invoiceNumber}`);
    doc.text(`Issue Date: ${payload.issueDate}`);
    doc.text(`Due Date: ${payload.dueDate}`);
    doc.moveDown();

    doc.fontSize(12).text(`Issued By: ${payload.issuerName}`);
    doc.text(`Email: ${payload.issuerEmail}`);
    doc.moveDown(0.5);
    doc.text(`Billed To: ${payload.clientName}`);
    doc.text(`Email: ${payload.clientEmail}`);
    doc.moveDown();

    doc.fontSize(13).text("Items", { underline: true });
    doc.moveDown(0.3);

    payload.lineItems.forEach((item) => {
      const amount = item.quantity * item.price;
      doc
        .fontSize(11)
        .text(item.name, 48)
        .text(`${item.quantity} x ${formatMoney(item.price, payload.currency)}`, 320)
        .text(formatMoney(amount, payload.currency), 460, undefined, { align: "right" });
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.text(`Subtotal: ${formatMoney(payload.subtotal, payload.currency)}`, { align: "right" });
    doc.text(`Tax: ${formatMoney(payload.taxAmount, payload.currency)}`, { align: "right" });
    doc.fontSize(13).text(`Total: ${formatMoney(payload.total, payload.currency)}`, {
      align: "right",
    });

    doc.moveDown();
    doc.fontSize(12).text("Payment Details", { underline: true });
    payload.paymentDetails.forEach((detail) => doc.fontSize(10).text(`- ${detail}`));

    if (payload.notes) {
      doc.moveDown();
      doc.fontSize(11).text("Notes", { underline: true });
      doc.fontSize(10).text(payload.notes);
    }

    doc.end();
  });
}
