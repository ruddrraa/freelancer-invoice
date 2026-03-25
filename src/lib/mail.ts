import nodemailer from "nodemailer";
import { env } from "@/lib/env";

type SendInvoiceMailInput = {
  to: string;
  subject: string;
  html: string;
  pdfBuffer: Buffer;
  invoiceNumber: string;
  senderName?: string;
  smtpConfig?: {
    email: string;
    appPassword: string;
  };
};

function resolvePersonalSmtpHost(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  if (["gmail.com", "googlemail.com"].includes(domain)) {
    return { host: "smtp.gmail.com", port: 587, secure: false };
  }
  if (["outlook.com", "hotmail.com", "live.com", "msn.com", "office365.com"].includes(domain)) {
    return { host: "smtp.office365.com", port: 587, secure: false };
  }
  return null;
}

export async function sendInvoiceMail(input: SendInvoiceMailInput) {
  if (input.smtpConfig?.email && input.smtpConfig.appPassword) {
    const smtp = resolvePersonalSmtpHost(input.smtpConfig.email);
    if (!smtp) {
      throw new Error("Only Gmail/Outlook personal SMTP is supported in profile mail settings");
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: input.smtpConfig.email,
        pass: input.smtpConfig.appPassword,
      },
    });

    const fromAddress = `${input.senderName || env.APP_NAME} <${input.smtpConfig.email}>`;

    await transporter.sendMail({
      from: fromAddress,
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
    return;
  }

  const fromAddress = env.MAIL_FROM || (env.SMTP_USER ? `${env.APP_NAME} <${env.SMTP_USER}>` : undefined);

  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new Error("No SMTP email provider is configured");
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
    from: fromAddress,
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
