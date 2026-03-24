import mongoose, { InferSchemaType, Model } from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true, lowercase: true },
    passwordHash: { type: String },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    upiId: { type: String, default: "" },
    bankDetailsEncrypted: { type: String, default: "" },
    paypalEmail: { type: String, default: "" },
    wiseDetailsEncrypted: { type: String, default: "" },
    stripePaymentLink: { type: String, default: "" },
    defaultCurrency: { type: String, default: "INR" },
    oauthProviders: {
      googleSub: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

const User = (mongoose.models.User as Model<UserDocument>) ||
  mongoose.model<UserDocument>("User", UserSchema);

export default User;
