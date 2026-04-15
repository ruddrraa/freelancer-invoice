import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  companyName: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  logoUrl: z.url().optional().or(z.literal("")),
  upiId: z.string().max(100).optional().or(z.literal("")),
  bankDetails: z.string().max(800).optional().or(z.literal("")),
  paypalEmail: z.email().optional().or(z.literal("")),
  wiseDetails: z.string().max(300).optional().or(z.literal("")),
  stripePaymentLink: z.url().optional().or(z.literal("")),
  smtpSenderEmail: z.email().optional().or(z.literal("")),
  smtpAppPassword: z.string().max(200).optional().or(z.literal("")),
  defaultCurrency: z.string().default("INR"),
});

export const clientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.email(),
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must include country code, e.g. +919876543210"),
  address: z.string().max(300).optional().or(z.literal("")),
  country: z.string().max(100).optional().or(z.literal("")),
  clientType: z.enum(["domestic", "international"]),
  currency: z.string().default("INR"),
});

export const lineItemSchema = z.object({
  name: z.string().min(1).max(120),
  quantity: z.number().min(0.01),
  price: z.number().min(0),
});

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(2).max(60).optional(),
  issueDate: z.iso.date(),
  dueDate: z.iso.date(),
  clientId: z.string().optional(),
  clientType: z.enum(["domestic", "international"]),
  clientSnapshot: z.object({
    name: z.string().min(2),
    email: z.email(),
    phone: z.string().optional(),
    address: z.string().optional(),
  }),
  lineItems: z.array(lineItemSchema).min(1),
  taxType: z.enum(["percentage", "fixed", "gst", "igst", "sgst"]).default("gst"),
  taxValue: z.number().min(0).default(0),
  currency: z.string().min(3).max(8),
  notes: z.string().max(600).optional().or(z.literal("")),
  terms: z.string().max(600).optional().or(z.literal("")),
});
