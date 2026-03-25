import PDFDocument from "pdfkit";

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
  currency: string;
  lineItems: Array<{ name: string; quantity: number; price: number }>;
  subtotal: number;
  taxAmount: number;
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
    if (payload.issuerLogo) {
      doc.image(payload.issuerLogo, left, 52, { fit: [32, 32] });
    } else {
      doc.roundedRect(left, 52, 32, 32, 6).fill("#171717");
      doc
        .fillColor("#ffffff")
        .font("Helvetica-Bold")
        .fontSize(12)
        .text("FI", left, 62, { width: 32, align: "center" });
      doc.fillColor(textColor);
    }

    doc.font("Helvetica-Bold").fontSize(30).text("Invoice", left, 95);
    const metaColA = right - 140;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(muted)
      .text("Invoice no.", metaColA, 58, { width: 120, align: "right" })
      .text(payload.invoiceNumber, metaColA, 74, { width: 120, align: "right" })
      .text("Issue date", metaColA, 98, { width: 120, align: "right" })
      .text(payload.issueDate, metaColA, 114, { width: 120, align: "right" });

    doc.moveTo(left, 146).lineTo(right, 146).lineWidth(1).strokeColor(rule).stroke();

    // Billed / Issued blocks
    doc.fillColor(muted).font("Helvetica-Bold").fontSize(10).text("Billed to", left, 168);
    doc
      .fillColor(textColor)
      .font("Helvetica")
      .fontSize(12)
      .text(payload.clientName, left, 184)
      .fillColor(muted)
      .fontSize(10)
      .text(payload.clientEmail, left, 202);

    doc.fillColor(muted).font("Helvetica-Bold").fontSize(10).text("Issued by", left + 278, 168);
    doc.fillColor(textColor).font("Helvetica").fontSize(12);
    if (payload.issuerCompanyName) {
      doc
        .font("Helvetica-Bold")
        .text(payload.issuerCompanyName, left + 278, 184)
        .font("Helvetica")
        .text(payload.issuerName, left + 278, 200)
        .fillColor(muted)
        .fontSize(10)
        .text(payload.issuerEmail, left + 278, 216);

      let issuerY = 230;
      if (payload.issuerPhone) {
        doc.text(payload.issuerPhone, left + 278, issuerY);
        issuerY += 12;
      }
      if (payload.issuerAddress) {
        doc.text(payload.issuerAddress, left + 278, issuerY, { width: 220 });
      }
    } else {
      doc
        .font("Helvetica")
        .text(payload.issuerName, left + 278, 184)
        .fillColor(muted)
        .fontSize(10)
        .text(payload.issuerEmail, left + 278, 202);

      let issuerY = 216;
      if (payload.issuerPhone) {
        doc.text(payload.issuerPhone, left + 278, issuerY);
        issuerY += 12;
      }
      if (payload.issuerAddress) {
        doc.text(payload.issuerAddress, left + 278, issuerY, { width: 220 });
      }
    }

    // Amount due line
    doc
      .fillColor(textColor)
      .font("Helvetica-Bold")
      .fontSize(16)
      .text(amountDueLine, left, 244);

    doc.moveTo(left, 281).lineTo(right, 281).lineWidth(1).strokeColor(rule).stroke();

    // Line item header
    const tableTop = 304;
    const col1 = left;
    const col2 = right - 220;
    const col3 = right - 145;
    const col4 = right - 75;

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor(textColor)
      .text("Product or service", col1, tableTop)
      .text("Qty", col2, tableTop, { width: 55, align: "right" })
      .text("Unit price", col3, tableTop, { width: 70, align: "right" })
      .text("Total", col4, tableTop, { width: 75, align: "right" });

    doc.moveTo(left, tableTop + 18).lineTo(right, tableTop + 18).lineWidth(1).strokeColor(rule).stroke();

    let y = tableTop + 26;

    payload.lineItems.forEach((item) => {
      const itemTotal = item.quantity * item.price;
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(textColor)
        .text(item.name, col1, y, { width: col2 - col1 - 16 })
        .text(String(item.quantity), col2, y, { width: 55, align: "right" })
        .text(formatInvoiceMoney(item.price, payload.currency), col3, y, { width: 70, align: "right" })
        .text(formatInvoiceMoney(itemTotal, payload.currency), col4, y, { width: 75, align: "right" });
      y += 24;
    });

    doc.moveTo(left, y - 4).lineTo(right, y - 4).lineWidth(0.8).strokeColor(rule).stroke();

    // Totals block
    const totalsX = left + 255;
    const totalsY = y + 8;

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(muted)
      .text("Total excluding tax", totalsX, totalsY)
      .text(formatInvoiceMoney(payload.subtotal, payload.currency), col4, totalsY, { width: 75, align: "right" })
      .text("Total tax", totalsX, totalsY + 20)
      .text(formatInvoiceMoney(payload.taxAmount, payload.currency), col4, totalsY + 20, {
        width: 75,
        align: "right",
      });

    doc.moveTo(totalsX, totalsY + 46).lineTo(right, totalsY + 46).lineWidth(0.8).strokeColor(rule).stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor(textColor)
      .text("Amount Due", totalsX, totalsY + 58)
      .text(formatInvoiceMoney(payload.total, payload.currency), col4, totalsY + 58, { width: 75, align: "right" });

    // Payment details section
    const paymentTop = totalsY + 118;
    doc.moveTo(left, paymentTop).lineTo(right, paymentTop).lineWidth(1).strokeColor(rule).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(textColor).text("Ways to pay", left, paymentTop + 14);

    const sectionTop = paymentTop + 38;

    if (payload.clientType === "domestic") {
      doc.font("Helvetica").fontSize(11).fillColor(textColor);
      if (payload.paymentDetails.upiId) {
        doc.text(`UPI: ${payload.paymentDetails.upiId}`, left, sectionTop, { width: 330 });
      } else {
        doc.fillColor(muted).text("UPI ID not added", left, sectionTop, { width: 330 });
      }

      if (payload.paymentDetails.bankDetails) {
        doc
          .fillColor(textColor)
          .font("Helvetica-Bold")
          .fontSize(10)
          .text("Bank account", left, sectionTop + 24)
          .font("Helvetica")
          .fontSize(10)
          .text(payload.paymentDetails.bankDetails, left, sectionTop + 40, {
            width: 330,
            lineGap: 2,
          });
      }

      if (payload.upiQrPng) {
        doc.image(payload.upiQrPng, right - 124, sectionTop - 2, {
          fit: [110, 110],
          align: "right",
        });
        doc
          .fillColor(muted)
          .font("Helvetica")
          .fontSize(8)
          .text("Scan to pay", right - 124, sectionTop + 112, { width: 110, align: "center" });
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
    }

    if (payload.notes) {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(textColor)
        .text("Notes", left, sectionTop + 140)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(payload.notes, left, sectionTop + 154, { width: contentWidth });
    }

    if (payload.terms) {
      const termsBase = payload.notes ? sectionTop + 196 : sectionTop + 140;
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(textColor)
        .text("Terms", left, termsBase)
        .font("Helvetica")
        .fontSize(9)
        .fillColor(muted)
        .text(payload.terms, left, termsBase + 14, { width: contentWidth });
    }

    doc.end();
  });
}
