import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { ApiResponse } from "../utils/Apiresponse";
import { ProductModel } from "../models/product.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import path from "path";
const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[]; // ✅ array of files
  let image: string[] = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const normalizedPath = path.resolve(file.path);
      const uploaded = await uploadOnCloudinary(normalizedPath);
      if (uploaded && uploaded.secure_url) {
        image.push(uploaded.secure_url); // ✅ collect all URLs
      }
    }
  }
  console.log("IMAGES:", image);
  const weights = JSON.parse(req.body.weights);
  const tags = JSON.parse(req.body.tags);
  const badge = JSON.parse(req.body.badge);
  const reviews = JSON.parse(req.body.reviews);
  const features = JSON.parse(req.body.features);
  const categories = JSON.parse(req.body.categories);

  const {
    name,
    rating,
    reviewCount,
    description,
    sku,

    detailedDescription,
    inStock,
    stockText,
    originalPrice,
    currentPrice,
    salePrice,
    currency,
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
});
const getAllProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await ProductModel.find();
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products retrieved successfully"));
});
export { createProduct, getAllProducts };
