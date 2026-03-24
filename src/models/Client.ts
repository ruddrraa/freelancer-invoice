import mongoose, { InferSchemaType, Model } from "mongoose";

const ClientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    country: { type: String, default: "" },
    clientType: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
      index: true,
    },
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

ClientSchema.index({ userId: 1, email: 1 });

export type ClientDocument = InferSchemaType<typeof ClientSchema> & {
  _id: mongoose.Types.ObjectId;
};

const Client = (mongoose.models.Client as Model<ClientDocument>) ||
  mongoose.model<ClientDocument>("Client", ClientSchema);

export default Client;
