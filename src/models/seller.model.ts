import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface ISeller extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  GSTNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  bankDetails: BankDetails;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const bankDetailsSchema = new Schema<BankDetails>(
  {
    accountHolderName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ifscCode: { type: String, required: true, trim: true, uppercase: true },
    bankName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const sellerSchema = new Schema<ISeller>(
  {
    name: { type: String, required: [true, "Name is required"], trim: true },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, required: [true, "Phone is required"], trim: true },
    businessName: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    GSTNumber: {
      type: String,
      required: [true, "GST number is required"],
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    city: { type: String, required: [true, "City is required"], trim: true },
    state: { type: String, required: [true, "State is required"], trim: true },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    bankDetails: { type: bankDetailsSchema, required: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

export const SellerModel: Model<ISeller> = mongoose.model<ISeller>(
  "Seller",
  sellerSchema
);
