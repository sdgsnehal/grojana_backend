import mongoose from "mongoose";
import { ApiError } from "./ApiError";
import { ProductModel } from "../models/product.model";

const SHIPPING_FEE = 59;
const FREE_SHIPPING_THRESHOLD = 1499;
const TAX_RATE = 0.00;

export interface OrderPricingItemInput {
  product: string;
  quantity: number;
  weight?: string;
}

export interface ResolvedOrderItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  weight: string;
  price: number;
  totalPrice: number;
}

export interface OrderPricingResult {
  items: ResolvedOrderItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  taxAmount: number;
  totalAmount: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export async function computeOrderPricing(
  itemsInput: OrderPricingItemInput[],
): Promise<OrderPricingResult> {
  if (!Array.isArray(itemsInput) || itemsInput.length === 0) {
    throw new ApiError(400, "Items are required", [], "", "INVALID_ITEMS");
  }

  for (const it of itemsInput) {
    if (
      !it ||
      typeof it.product !== "string" ||
      !mongoose.isValidObjectId(it.product) ||
      typeof it.quantity !== "number" ||
      !Number.isFinite(it.quantity) ||
      it.quantity < 1
    ) {
      throw new ApiError(400, "Invalid item in order", [], "", "INVALID_ITEMS");
    }
  }

  const productIds = itemsInput.map((it) => it.product);
  const products = await ProductModel.find({ _id: { $in: productIds } });
  const productMap = new Map(
    products.map((p) => [(p._id as mongoose.Types.ObjectId).toString(), p]),
  );

  let subtotal = 0;
  let discountAmount = 0;
  const resolvedItems: ResolvedOrderItem[] = [];

  for (const it of itemsInput) {
    const product = productMap.get(it.product);
    if (!product) {
      throw new ApiError(404, "Product not found", [], "", "PRODUCT_NOT_FOUND");
    }
    if (!product.inStock) {
      throw new ApiError(
        400,
        `${product.name} is out of stock`,
        [],
        "",
        "OUT_OF_STOCK",
      );
    }

    let originalUnitPrice: number;
    let currentUnitPrice: number | undefined;
    let saleUnitPrice: number | undefined;
    let weightLabel = "";

    if (it.weight) {
      const variant = product.weights.find((w) => w.weight === it.weight);
      if (!variant) {
        throw new ApiError(
          400,
          "Invalid weight option",
          [],
          "",
          "INVALID_WEIGHT_OPTION",
        );
      }
      originalUnitPrice = Number(variant.originalPrice);
      currentUnitPrice = variant.currentPrice
        ? Number(variant.currentPrice)
        : undefined;
      weightLabel = it.weight;
    } else {
      originalUnitPrice = product.originalPrice;
      currentUnitPrice = product.currentPrice;
      saleUnitPrice = product.salePrice;
    }

    const chargedUnitPrice =
      saleUnitPrice && saleUnitPrice > 0
        ? saleUnitPrice
        : currentUnitPrice && currentUnitPrice > 0
        ? currentUnitPrice
        : originalUnitPrice;

    const lineTotal = round2(chargedUnitPrice * it.quantity);
    subtotal += lineTotal;
    discountAmount += round2((originalUnitPrice - chargedUnitPrice) * it.quantity);

    resolvedItems.push({
      product: product._id as mongoose.Types.ObjectId,
      quantity: it.quantity,
      weight: weightLabel,
      price: chargedUnitPrice,
      totalPrice: lineTotal,
    });
  }

  subtotal = round2(subtotal);
  discountAmount = round2(discountAmount);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const taxAmount = round2(subtotal * TAX_RATE);
  const totalAmount = round2(subtotal + shippingCost + taxAmount);

  return {
    items: resolvedItems,
    subtotal,
    discountAmount,
    shippingCost,
    taxAmount,
    totalAmount,
  };
}
