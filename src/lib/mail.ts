import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";

type SendInvoiceMailInput = {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  invoiceNumber: string;
};

export async function sendInvoiceMail(input: SendInvoiceMailInput) {
  if (env.RESEND_API_KEY) {
    const resend = new Resend(env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Freelancer Invoice <no-reply@yourdomain.com>",
      to: [input.to],
      subject: input.subject,
      html: input.html,
      attachments: [
        {
          filename: `${input.invoiceNumber}.pdf`,
          content: input.pdfBuffer,
        },
      ],
    });
    return;
  }

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("No email provider is configured");
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: Number(env.SMTP_PORT),
    secure: Number(env.SMTP_PORT) === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `Freelancer Invoice <${env.SMTP_USER}>`,
    to: input.to,
    subject: input.subject,
    html: input.html,
    attachments: [
      {
        filename: `${input.invoiceNumber}.pdf`,
        content: input.pdfBuffer,
      },
    ],
  });
}
