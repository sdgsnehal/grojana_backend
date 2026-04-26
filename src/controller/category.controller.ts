import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/Apiresponse";
import { Category } from "../models/category.model";

const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, parent, properties } = req.body;

  if (!name) {
    throw new ApiError(400, "Category name is required");
  }

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      throw new ApiError(404, "Parent category not found");
    }
  }

  const existing = await Category.findOne({ name, parent: parent || null });
  if (existing) {
    throw new ApiError(409, "Category with this name already exists");
  }

  const category = await Category.create({ name, parent, properties });

  return res
    .status(201)
    .json(new ApiResponse(201, category, "Category created successfully"));
});

const getAllCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await Category.find().populate("parent", "name");

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories retrieved successfully"));
});

const getCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid category ID");
  }

  const category = await Category.findById(id).populate("parent", "name");

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category fetched successfully"));
});

const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, parent, properties } = req.body;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid category ID");
  }

  if (parent) {
    const parentExists = await Category.findById(parent);
    if (!parentExists) {
      throw new ApiError(404, "Parent category not found");
    }
    if (parent === id) {
      throw new ApiError(400, "Category cannot be its own parent");
    }
  }

  const updated = await Category.findByIdAndUpdate(
    id,
    { name, parent, properties },
    { new: true, runValidators: true }
  ).populate("parent", "name");

  if (!updated) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Category updated successfully"));
});

const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid category ID");
  }

  const hasChildren = await Category.findOne({ parent: id });
  if (hasChildren) {
    throw new ApiError(
      400,
      "Cannot delete category that has sub-categories. Delete or reassign them first."
    );
  }

  const deleted = await Category.findByIdAndDelete(id);

  if (!deleted) {
    throw new ApiError(404, "Category not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});

export {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
