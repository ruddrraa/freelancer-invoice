import mongoose, { InferSchemaType, Model } from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ["stripe", "paypal", "wise", "upi", "bank", "manual"],
      required: true,
      index: true,
    },
    providerPaymentId: { type: String, default: "", index: true },
    status: {
      type: String,
      enum: ["initiated", "completed", "failed", "refunded"],
      default: "initiated",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

PaymentSchema.index({ invoiceId: 1, provider: 1, providerPaymentId: 1 });

export type PaymentDocument = InferSchemaType<typeof PaymentSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Payment = (mongoose.models.Payment as Model<PaymentDocument>) ||
  mongoose.model<PaymentDocument>("Payment", PaymentSchema);

export default Payment;
