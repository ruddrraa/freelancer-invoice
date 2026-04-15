import mongoose, { InferSchemaType, Model } from "mongoose";

const LineItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: "Client", index: true },
    invoiceNumber: { type: String, required: true },
    issueDate: { type: Date, required: true, index: true },
    dueDate: { type: Date, required: true, index: true },
    clientType: { type: String, enum: ["domestic", "international"], required: true },
    clientSnapshot: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
    },
    issuerSnapshot: {
      name: { type: String, required: true },
      companyName: { type: String, default: "" },
      email: { type: String, required: true },
      phone: { type: String, default: "" },
      address: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
      signatureUrl: { type: String, default: "" },
    },
    lineItems: { type: [LineItemSchema], required: true },
    taxType: { type: String, enum: ["percentage", "fixed", "gst", "igst", "sgst"], required: true },
    taxValue: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true, index: true },
    currency: { type: String, default: "INR" },
    notes: { type: String, default: "" },
    terms: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "paid", "overdue"],
      default: "pending",
      index: true,
    },
    paidAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
    emailStatus: { type: String, enum: ["not_sent", "sent", "failed"], default: "not_sent" },
    paymentDetailsSnapshot: {
      upiId: { type: String, default: "" },
      upiUri: { type: String, default: "" },
      bankDetails: { type: String, default: "" },
      paypalLink: { type: String, default: "" },
      wiseLink: { type: String, default: "" },
      stripeLink: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

InvoiceSchema.index({ userId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ userId: 1, status: 1, createdAt: -1 });

export type InvoiceDocument = InferSchemaType<typeof InvoiceSchema> & {
  _id: mongoose.Types.ObjectId;
};

if (process.env.NODE_ENV !== "production" && mongoose.models.Invoice) {
  delete mongoose.models.Invoice;
}

const Invoice = (mongoose.models.Invoice as Model<InvoiceDocument>) ||
  mongoose.model<InvoiceDocument>("Invoice", InvoiceSchema);

export default Invoice;
