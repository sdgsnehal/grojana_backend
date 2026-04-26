import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  parent?: mongoose.Types.ObjectId;
  properties: object[];
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    properties: [{ type: Object }],
  },
  { timestamps: true }
);

export const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", CategorySchema);
