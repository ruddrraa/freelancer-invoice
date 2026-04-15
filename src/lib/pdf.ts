import PDFDocument from "pdfkit";
import { getTaxSummaryLabel } from "@/lib/invoice";
import { TaxType } from "@/types";

function formatInvoiceMoney(value: number, currency: string) {
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${currency} ${formatted}`;
}

type PdfPayload = {
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  clientType: "domestic" | "international";
  issuerName: string;
  issuerCompanyName?: string;
  issuerEmail: string;
  issuerPhone?: string;
  issuerAddress?: string;
  issuerLogo?: Buffer;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  currency: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
  taxType: TaxType;
  taxValue: number;
  total: number;
  notes?: string;
  terms?: string;
  paymentDetails: {
    upiId?: string;
    bankDetails?: string;
    paypal?: string;
    wise?: string;
    stripe?: string;
  };
  upiQrPng?: Buffer;
};

export function generateInvoicePdf(payload: PdfPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 46, size: "A4" });
    const chunks: Buffer[] = [];
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - 92;
    const left = 46;
    const right = left + contentWidth;

    const textColor = "#111111";
    const muted = "#616161";
    const rule = "#d7d7d7";

    const amountDueLine = `${formatInvoiceMoney(payload.total, payload.currency)} due by ${payload.dueDate}`;

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fillColor(textColor);
    doc.font("Helvetica");

    // Header with logo
    const logoY = 52;
    if (payload.issuerLogo) {
      doc.image(payload.issuerLogo, left, logoY, { fit: [178, 32], align: "left", valign: "top" });
    } else {
      doc.roundedRect(left, logoY, 32, 32, 6).fill("#171717");
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("FI", left, logoY + 10, { width: 32, align: "center" });
      doc.fillColor(textColor);
    }

    const titleY = 95;
    doc.font("Helvetica-Bold").fontSize(30).text("Invoice", left, titleY);
    const titleBottomY = doc.y;

    const metaWidth = 140;
    const metaColA = right - metaWidth;
    const metaTop = 58;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(muted)
      .text("Invoice no.", metaColA, metaTop, { width: metaWidth, align: "right" })
      .fillColor(textColor)
      .fontSize(11)
      .text(payload.invoiceNumber, metaColA, metaTop + 16, { width: metaWidth, align: "right" })
      .fillColor(muted)
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Issue date", metaColA, metaTop + 42, { width: metaWidth, align: "right" })
      .fillColor(textColor)
      .fontSize(11)
      .text(payload.issueDate, metaColA, metaTop + 58, { width: metaWidth, align: "right" });

    const dividerOneY = Math.max(logoY + 32, titleBottomY, metaTop + 74) + 16;
    doc.moveTo(left, dividerOneY).lineTo(right, dividerOneY).lineWidth(1).strokeColor(rule).stroke();

    // Billed / Issued blocks
    const blockTop = dividerOneY + 22;
    const blockGap = 38;
    const blockWidth = (contentWidth - blockGap) / 2;
    const billedX = left;
    const issuedX = left + blockWidth + blockGap;

    doc.fillColor(muted).font("Helvetica-Bold").fontSize(10).text("BILLED TO", billedX, blockTop);
    let billedY = blockTop + 16;
    doc.fillColor(textColor).font("Helvetica-Bold").fontSize(12).text(payload.clientName || "Client name", billedX, billedY, {
      width: blockWidth,
    });
    billedY = doc.y + 2;

    if (payload.clientEmail) {
      doc.fillColor(muted).font("Helvetica").fontSize(10).text(payload.clientEmail, billedX, billedY, { width: blockWidth });
      billedY = doc.y + 2;
    }
    if (payload.clientPhone) {
      doc.fillColor(muted).font("Helvetica").fontSize(10).text(payload.clientPhone, billedX, billedY, { width: blockWidth });
      billedY = doc.y + 2;
    }
    if (payload.clientAddress) {
      doc
        .fillColor(muted)
        .font("Helvetica")
        .fontSize(10)
        .text(payload.clientAddress, billedX, billedY, { width: blockWidth, lineGap: 1 });
      billedY = doc.y + 2;
    }

    doc.fillColor(muted).font("Helvetica-Bold").fontSize(10).text("ISSUED BY", issuedX, blockTop);
    let issuerBottomY = blockTop + 16;
    if (payload.issuerCompanyName) {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(textColor)
        .text(payload.issuerCompanyName, issuedX, issuerBottomY, { width: blockWidth })
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(textColor)
        .text(payload.issuerName, issuedX, doc.y + 2, { width: blockWidth })
        .fillColor(muted)
        .fontSize(10)
        .font("Helvetica")
        .text(payload.issuerEmail, issuedX, doc.y + 2, { width: blockWidth });

      let issuerY = doc.y + 2;
      if (payload.issuerPhone) {
        doc.text(payload.issuerPhone, issuedX, issuerY, { width: blockWidth });
        issuerY = doc.y + 2;
      }
      if (payload.issuerAddress) {
        doc.text(payload.issuerAddress, issuedX, issuerY, { width: blockWidth, lineGap: 1 });
        issuerY = doc.y + 2;
      }
      issuerBottomY = issuerY;
    } else {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(textColor)
        .text(payload.issuerName, issuedX, issuerBottomY, { width: blockWidth })
        .fillColor(muted)
        .font("Helvetica")
        .fontSize(10)
        .text(payload.issuerEmail, issuedX, doc.y + 2, { width: blockWidth });

      let issuerY = doc.y + 2;
      if (payload.issuerPhone) {
        doc.text(payload.issuerPhone, issuedX, issuerY, { width: blockWidth });
        issuerY = doc.y + 2;
      }
      if (payload.issuerAddress) {
        doc.text(payload.issuerAddress, issuedX, issuerY, { width: blockWidth, lineGap: 1 });
        issuerY = doc.y + 2;
      }
      issuerBottomY = issuerY;
    }

    const detailsBottomY = Math.max(billedY, issuerBottomY);
    const amountDueY = detailsBottomY + 16;

    // Amount due line
    doc
      .fillColor(textColor)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(amountDueLine, left, amountDueY, { width: contentWidth });

    const tableRuleY = doc.y + 14;
    doc.moveTo(left, tableRuleY).lineTo(right, tableRuleY).lineWidth(1).strokeColor(rule).stroke();

    // Line item header
    const tableTop = tableRuleY + 18;
    const qtyWidth = 52;
    const unitPriceWidth = 112;
    const totalWidth = 112;
    const productWidth = contentWidth - qtyWidth - unitPriceWidth - totalWidth;

    const col1 = left;
    const col2 = col1 + productWidth;
    const col3 = col2 + qtyWidth;
    const col4 = col3 + unitPriceWidth;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(muted)
      .text("Product or service", col1, tableTop)
      .text("Qty", col2, tableTop, { width: qtyWidth, align: "right" })
      .text("Unit price", col3, tableTop, { width: unitPriceWidth, align: "right" })
      .text("Total", col4, tableTop, { width: totalWidth, align: "right" });

    doc.moveTo(left, tableTop + 18).lineTo(right, tableTop + 18).lineWidth(1).strokeColor(rule).stroke();

    let y = tableTop + 22;

    payload.lineItems.forEach((item) => {
      const name = item.name || "Line item";
      const qty = String(item.quantity);
      const itemTotal = item.quantity * item.price;
      const unitPrice = formatInvoiceMoney(item.price, payload.currency);
      const totalPrice = formatInvoiceMoney(itemTotal, payload.currency);

      doc.font("Helvetica").fontSize(10);
      const rowHeight =
        Math.max(
          18,
          doc.heightOfString(name, { width: productWidth - 12 }),
          doc.heightOfString(qty, { width: qtyWidth, align: "right" }),
          doc.heightOfString(unitPrice, { width: unitPriceWidth, align: "right" }),
          doc.heightOfString(totalPrice, { width: totalWidth, align: "right" })
        ) + 6;

      const rowTextY = y + 2;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(textColor)
        .text(name, col1, rowTextY, { width: productWidth - 12 })
        .text(qty, col2, rowTextY, { width: qtyWidth, align: "right" })
        .text(unitPrice, col3, rowTextY, { width: unitPriceWidth, align: "right" })
        .text(totalPrice, col4, rowTextY, { width: totalWidth, align: "right" });

      y += rowHeight;
      doc.moveTo(left, y).lineTo(right, y).lineWidth(0.8).strokeColor(rule).stroke();
    });

    // Totals block
    const totalsY = y + 10;
    const totalsLabelX = right - 286;
    const totalsAmountWidth = 130;
    const totalsAmountX = right - totalsAmountWidth;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(muted)
      .text("Total excluding tax", totalsLabelX, totalsY)
      .text(formatInvoiceMoney(payload.subtotal, payload.currency), totalsAmountX, totalsY, {
        width: totalsAmountWidth,
        align: "right",
      })
      .text(getTaxSummaryLabel(payload.taxType, payload.taxValue), totalsLabelX, totalsY + 20)
      .text(formatInvoiceMoney(payload.taxAmount, payload.currency), totalsAmountX, totalsY + 20, {
        width: totalsAmountWidth,
        align: "right",
      });

    doc.moveTo(totalsLabelX, totalsY + 46).lineTo(right, totalsY + 46).lineWidth(0.8).strokeColor(rule).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(textColor)
      .text("Amount Due", totalsLabelX, totalsY + 58)
      .text(formatInvoiceMoney(payload.total, payload.currency), totalsAmountX, totalsY + 56, {
        width: totalsAmountWidth,
        align: "right",
      });

    // Payment details section
    const paymentTop = totalsY + 102;
    doc.moveTo(left, paymentTop).lineTo(right, paymentTop).lineWidth(1).strokeColor(rule).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor).text("Ways to pay", left, paymentTop + 14);

    const sectionTop = paymentTop + 36;
    let paymentBottomY = sectionTop;

    if (payload.clientType === "domestic") {
      const qrSize = 110;
      const hasQr = Boolean(payload.upiQrPng);
      const paymentTextWidth = hasQr ? contentWidth - qrSize - 24 : contentWidth;

      doc.font("Helvetica").fontSize(11).fillColor(textColor);
      let paymentTextY = sectionTop;
      if (payload.paymentDetails.upiId) {
        doc.text(`UPI: ${payload.paymentDetails.upiId}`, left, paymentTextY, { width: paymentTextWidth });
      } else {
        doc.fillColor(muted).text("UPI ID not added", left, paymentTextY, { width: paymentTextWidth });
      }
      paymentTextY = doc.y + 10;

      if (payload.paymentDetails.bankDetails) {
        doc
          .fillColor(textColor)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Bank account", left, paymentTextY)
          .font("Helvetica")
          .fontSize(10)
          .text(payload.paymentDetails.bankDetails, left, doc.y + 4, {
            width: paymentTextWidth,
            lineGap: 2,
          });
        paymentTextY = doc.y + 2;
      }
      paymentBottomY = paymentTextY;

      if (payload.upiQrPng) {
        const qrX = right - qrSize;
        const qrY = sectionTop;
        doc.image(payload.upiQrPng, qrX, qrY, {
          fit: [qrSize, qrSize],
          align: "right",
        });
        doc
          .fillColor(muted)
          .font("Helvetica")
          .fontSize(8)
          .text("Scan to pay", qrX, qrY + qrSize + 2, { width: qrSize, align: "center" });

        paymentBottomY = Math.max(paymentBottomY, qrY + qrSize + 14);
      }
    } else {
      const lines = [
        payload.paymentDetails.paypal ? `PayPal: ${payload.paymentDetails.paypal}` : "",
        payload.paymentDetails.wise ? `Wise: ${payload.paymentDetails.wise}` : "",
        payload.paymentDetails.stripe ? `Stripe: ${payload.paymentDetails.stripe}` : "",
      ].filter(Boolean);

      doc.font("Helvetica").fontSize(10).fillColor(textColor);
      (lines.length ? lines : ["International payment details not added yet"]).forEach((line, index) => {
        doc.text(line, left, sectionTop + index * 16, { width: contentWidth });
      });

      paymentBottomY = sectionTop + Math.max(lines.length, 1) * 16;
    }

    let notesBaseY = paymentBottomY + 14;

    if (payload.notes) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(textColor)
        .text("Notes", left, notesBaseY)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(payload.notes, left, notesBaseY + 14, { width: contentWidth });

      notesBaseY = doc.y + 8;
    }

    if (payload.terms) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(textColor)
        .text("Terms", left, notesBaseY)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(payload.terms, left, notesBaseY + 14, { width: contentWidth });
    }

    doc.end();
  });
}
