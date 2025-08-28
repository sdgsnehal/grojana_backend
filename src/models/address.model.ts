import mongoose, { Schema, Document, Model, Types } from "mongoose";
export interface IAddress {
  name: string;
  mobile: number;
  streetAddress: string;
  address: string;
  city: string;
  state: string;
  zip: number;
}
const addressSchema: Schema = new Schema({
  name: { type: String, required: true },
  mobile: { type: Number, required: true },
  streetAddress: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zip: { type: Number, required: true },
});
export const Address: Model<IAddress> = mongoose.model<IAddress>(
  "Address",
  addressSchema
);
