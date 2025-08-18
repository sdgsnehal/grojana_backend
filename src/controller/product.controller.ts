import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { ApiResponse } from "../utils/Apiresponse";
import { ProductModel } from "../models/product.model";
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      image,
      tags,
      rating,
      reviewCount,
      description,
      weights,
      sku,
      categories,
      detailedDescription,
      inStock,
      stockText,
      originalPrice,
      currentPrice,
      features,
      reviews,
      salePrice,
      currency,
      badge,
      isBestSeller,
      isOnSale,
      isPromo,
      ladduTypes,
    } = req.body;

    // 🔎 Validation
    if (!name || !sku || !originalPrice || !image?.length) {
      throw new ApiError(
        400,
        "Missing required fields: name, sku, originalPrice, or image"
      );
    }

    // 🔎 Check if product with same SKU already exists
    const existingProduct = await ProductModel.findOne({ sku });
    if (existingProduct) {
      throw new ApiError(409, "Product with this SKU already exists");
    }

    // ✅ Create new product
    const newProduct = await ProductModel.create({
      name,
      image,
      tags,
      rating,
      reviewCount,
      description,
      weights,
      sku,
      categories,
      detailedDescription,
      inStock,
      stockText,
      originalPrice,
      currentPrice,
      features,
      reviews,
      salePrice,
      currency,
      badge,
      isBestSeller,
      isOnSale,
      isPromo,
      ladduTypes,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, newProduct, "Product created successfully"));
  }
);
