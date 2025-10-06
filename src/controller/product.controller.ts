import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { ApiResponse } from "../utils/Apiresponse";
import { ProductModel } from "../models/product.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { v4 as uuidv4 } from "uuid";

const createProduct = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body, "<-- product data");
  const {
    name,
    image,
    rating,
    reviewCount,
    description,
    weights,
    tags,
    badge,
    reviews,
    features,
    categories,
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
  const sku = `GROJ-AS-${uuidv4().slice(0, 6).toUpperCase()}`;
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
  console.log("success");
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
const uploadProductImages = asyncHandler(
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    console.log(req.files, "<-- uploaded files");

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedImages: { url: string; public_id: string }[] = [];

    for (const file of files) {
      // Upload directly from buffer
      const uploaded = await uploadOnCloudinary(file.buffer);
      console.log(uploaded);

      if (uploaded && uploaded.secure_url) {
        uploadedImages.push({
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        });
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          uploadedImages,
          "Images uploaded successfully to Cloudinary"
        )
      );
  }
);
const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Product Id");
  }

  const product = await ProductModel.findById(id);

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product fetched successfully"));
});

const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Product Id");
  }

  // Remove SKU from request body to prevent it from being updated
  const { sku, ...updateData } = req.body;

  if (sku) {
    throw new ApiError(400, "SKU cannot be modified");
  }

  const updatedProduct = await ProductModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

export { createProduct, getAllProducts, uploadProductImages, getProductById, updateProduct };
