import mongoose, { Schema, Document, Types } from "mongoose";

interface Review {
  user: Types.ObjectId;
  userName: string;
  rating: number;
  comment: string;
  date: Date;
}

interface WeightOption {
  weight: string;
  originalPrice: string;
  currentPrice: string;
}

export interface Product extends Document {
  id: string;
  name: string;
  image: string[];
  tags: string[];
  rating: number;
  reviewCount: number;
  description: string;
  weights: WeightOption[];
  sku: string;
  categories: string[];
  detailedDescription: string;
  inStock: boolean;
  stockText: string;
  originalPrice: number;
  currentPrice?: number;
  features: string[];
  reviews: Review[];
  salePrice?: number;
  currency?: string;
  badge?: {
    text: string;
    bgColor?: string;
    textColor?: string;
  };
  isBestSeller?: boolean;
  isOnSale?: boolean;
  isPromo?: boolean;
  ladduTypes?: string;
  className?: string;
}

const reviewSchema = new Schema<Review>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

const weightOptionSchema = new Schema<WeightOption>(
  {
    weight: { type: String, required: true },
    originalPrice: { type: String, required: true },
    currentPrice: { type: String, required: true },
  },
  { _id: false }
);

const productSchema = new Schema<Product>(
  {
    name: { type: String, required: true },
    image: { type: [String], required: true },
    tags: { type: [String], default: [] },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    description: { type: String },
    weights: {
      type: [weightOptionSchema],
      default: [],
    },
    sku: { type: String, unique: true, required: true },
    categories: { type: [String], default: [] },
    detailedDescription: { type: String },
    inStock: { type: Boolean, default: true },
    stockText: { type: String },
    originalPrice: { type: Number, required: true },
    currentPrice: { type: Number },
    features: { type: [String], default: [] },
    reviews: { type: [reviewSchema], default: [] },
    salePrice: { type: Number },
    currency: { type: String, default: "$" },
    badge: {
      text: { type: String },
      bgColor: { type: String },
      textColor: { type: String },
    },
    isBestSeller: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    isPromo: { type: Boolean, default: false },
    ladduTypes: { type: String },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", tags: "text" });
productSchema.index({ categories: 1 });
productSchema.index({ isBestSeller: 1, isOnSale: 1, isPromo: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ originalPrice: 1, salePrice: 1 });

export const ProductModel = mongoose.model<Product>("Product", productSchema);
