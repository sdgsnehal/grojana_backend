import mongoose, { Schema, Document, Types } from "mongoose";
import { IAddress } from "./address.model";

export interface OrderItem {
  product: Types.ObjectId;
  quantity: number;
  weight: string;
  price: number;
  totalPrice: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: IAddress;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  orderNumber: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  notes?: string;
}

const orderItemSchema = new Schema<OrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    weight: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IAddress>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    streetAddress: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zip: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items: OrderItem[]) {
          return items.length > 0;
        },
        message: "Order must contain at least one item",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash_on_delivery", "online_payment", "wallet"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    orderStatus: {
      type: String,
      required: true,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    estimatedDeliveryDate: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1 });

orderSchema.pre<IOrder>("save", function (next) {
  if (!this.orderNumber) {
    this.orderNumber = `GRJ${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

export const OrderModel = mongoose.model<IOrder>("Order", orderSchema);