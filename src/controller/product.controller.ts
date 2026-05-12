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
import { OrderModel } from "../models/order.model";

const createProduct = asyncHandler(async (req: Request, res: Response) => {
  console.log(req.body, "<-- product data");
  const {
    seller,
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
  if (!seller || !name || !sku || !originalPrice || !image?.length) {
    throw new ApiError(
      400,
      "Missing required fields: seller, name, sku, originalPrice, or image",
    );
  }

  // 🔎 Check if product with same SKU already exists
  const existingProduct = await ProductModel.findOne({ sku });
  if (existingProduct) {
    throw new ApiError(409, "Product with this SKU already exists");
  }

  // ✅ Create new product
  const newProduct = await ProductModel.create({
    seller,
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
  const { badge, category, sort } = req.query;

  const filter: Record<string, any> = {};

  if (badge) {
    filter["badge.text"] = { $regex: new RegExp(badge as string, "i") };
  }

  if (category) {
    const cats = (category as string).split(",").map((c) => c.trim());
    filter["categories"] = { $in: cats };
  }

  let sortOption: Record<string, 1 | -1> = {};
  if (sort === "price_asc") {
    sortOption = { originalPrice: 1 };
  } else if (sort === "price_desc") {
    sortOption = { originalPrice: -1 };
  }

  const products = await ProductModel.find(filter).sort(sortOption);
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products retrieved successfully"));
});
const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q, category, minPrice, maxPrice, inStock, sort, page, limit } = req.query;

  if (!q || !(q as string).trim()) {
    throw new ApiError(400, "Search query 'q' is required");
  }

  const filter: Record<string, any> = {
    $text: { $search: (q as string).trim() },
  };

  if (category) {
    const cats = (category as string).split(",").map((c) => c.trim());
    filter["categories"] = { $in: cats };
  }

  if (minPrice || maxPrice) {
    filter["originalPrice"] = {};
    if (minPrice) filter["originalPrice"]["$gte"] = Number(minPrice);
    if (maxPrice) filter["originalPrice"]["$lte"] = Number(maxPrice);
  }

  if (inStock === "true") filter["inStock"] = true;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(50, parseInt(limit as string) || 20);
  const skip = (pageNum - 1) * pageSize;

  let sortOption: Record<string, any> = { score: { $meta: "textScore" } };
  if (sort === "price_asc") sortOption = { originalPrice: 1 };
  else if (sort === "price_desc") sortOption = { originalPrice: -1 };
  else if (sort === "rating") sortOption = { rating: -1 };

  const [products, total] = await Promise.all([
    ProductModel.find(filter, { score: { $meta: "textScore" } })
      .sort(sortOption)
      .skip(skip)
      .limit(pageSize),
    ProductModel.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      products,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    }, "Search results fetched successfully")
  );
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
          "Images uploaded successfully to Cloudinary",
        ),
      );
  },
);
const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;
  const { sort } = req.query;

  if (!category) {
    throw new ApiError(400, "Category is required");
  }

  let sortOption: Record<string, 1 | -1> = {};
  if (sort === "price_asc") sortOption = { originalPrice: 1 };
  else if (sort === "price_desc") sortOption = { originalPrice: -1 };
  else if (sort === "rating") sortOption = { rating: -1 };

  const products = await ProductModel.find({
    categories: { $regex: new RegExp(`^${category}$`, "i") },
  }).sort(sortOption);

  return res
    .status(200)
    .json(new ApiResponse(200, products, `Products in category '${category}' fetched successfully`));
});

const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Product Id");
  }

  const product = await ProductModel.findById(id).populate(
    "seller",
    "name businessName",
  );

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

  const updatedProduct = await ProductModel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!updatedProduct) {
    throw new ApiError(404, "Product not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedProduct, "Product updated successfully"));
});

const addReview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const user = (req as any).user;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Product Id");
  }

  const parsedRating = Number(rating);
  if (!parsedRating || parsedRating < 1 || parsedRating > 5) {
    throw new ApiError(400, "Rating is required and must be between 1 and 5");
  }

  if (!user || !user._id) {
    throw new ApiError(401, "User not authenticated");
  }

  const product = await ProductModel.findById(id);
  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const hasPurchased = await OrderModel.findOne({
    user: user._id,
    "items.product": id,
    orderStatus: "delivered",
  });

  if (!hasPurchased) {
    throw new ApiError(
      403,
      "You can only review products you have purchased and received",
    );
  }

  const existingReview = product.reviews.find(
    (review) => review.user.toString() === user._id.toString(),
  );

  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this product");
  }

  // Upload review images to Cloudinary if provided
  const imageUrls: string[] = [];
  const files = req.files as Express.Multer.File[] | undefined;
  if (files && files.length > 0) {
    for (const file of files) {
      const uploaded = await uploadOnCloudinary(file.buffer);
      if (uploaded?.secure_url) {
        imageUrls.push(uploaded.secure_url);
      }
    }
  }

  product.reviews.push({
    user: user._id,
    userName: user.userName || user.fullName || "Anonymous",
    rating: parsedRating,
    comment: comment || "",
    images: imageUrls,
    date: new Date(),
  });

  const totalRating = product.reviews.reduce(
    (sum, review) => sum + review.rating,
    0,
  );
  product.rating = totalRating / product.reviews.length;
  product.reviewCount = product.reviews.length;

  await product.save();

  return res
    .status(201)
    .json(new ApiResponse(201, product, "Review added successfully"));
});

export {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  searchProducts,
  uploadProductImages,
  getProductById,
  updateProduct,
  addReview,
};
