import { Request, Response } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/Apiresponse";
import { SellerModel } from "../models/seller.model";

const bankDetailsSchema = z.object({
  accountHolderName: z.string().trim().min(1, "Account holder name is required"),
  accountNumber: z.string().trim().min(1, "Account number is required"),
  ifscCode: z.string().trim().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),
  bankName: z.string().trim().min(1, "Bank name is required"),
});

const createSellerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
  businessName: z.string().trim().min(1, "Business name is required"),
  GSTNumber: z
    .string()
    .trim()
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
      "Invalid GST number"
    ),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().min(1, "State is required"),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Invalid pincode"),
  bankDetails: bankDetailsSchema,
});

const updateSellerSchema = createSellerSchema.partial();

const createSeller = asyncHandler(async (req: Request, res: Response) => {
  const result = createSellerSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(", ");
    throw new ApiError(400, message);
  }

  const data = result.data;
  const existing = await SellerModel.findOne({ email: data.email });
  if (existing) {
    throw new ApiError(409, "Seller with this email already exists");
  }

  const seller = await SellerModel.create(data);
  return res.status(201).json(new ApiResponse(201, seller, "Seller created successfully"));
});

const getAllSellers = asyncHandler(async (_req: Request, res: Response) => {
  const sellers = await SellerModel.find().select("-bankDetails");
  return res.status(200).json(new ApiResponse(200, sellers, "Sellers retrieved successfully"));
});

const getSellerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const idResult = z.string().regex(/^[a-f\d]{24}$/i, "Invalid seller ID").safeParse(id);
  if (!idResult.success) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const seller = await SellerModel.findById(id);
  if (!seller) {
    throw new ApiError(404, "Seller not found");
  }

  return res.status(200).json(new ApiResponse(200, seller, "Seller fetched successfully"));
});

const updateSeller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const idResult = z.string().regex(/^[a-f\d]{24}$/i, "Invalid seller ID").safeParse(id);
  if (!idResult.success) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const result = updateSellerSchema.safeParse(req.body);
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(", ");
    throw new ApiError(400, message);
  }

  const updated = await SellerModel.findByIdAndUpdate(id, result.data, {
    new: true,
    runValidators: true,
  });

  if (!updated) {
    throw new ApiError(404, "Seller not found");
  }

  return res.status(200).json(new ApiResponse(200, updated, "Seller updated successfully"));
});

const deleteSeller = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const idResult = z.string().regex(/^[a-f\d]{24}$/i, "Invalid seller ID").safeParse(id);
  if (!idResult.success) {
    throw new ApiError(400, "Invalid seller ID");
  }

  const deleted = await SellerModel.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "Seller not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Seller deleted successfully"));
});

export { createSeller, getAllSellers, getSellerById, updateSeller, deleteSeller };
