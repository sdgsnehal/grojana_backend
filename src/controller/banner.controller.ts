import { Request, Response } from "express";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/Apiresponse";
import { BannerModel } from "../models/banner.model";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary";

const BANNER_FOLDER = "grojana/banners";

type BannerFiles = Record<string, Express.Multer.File[]> | undefined;

const assertValidId = (id: unknown) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, "Invalid Banner Id");
  }
};

// multipart/form-data sends every field as a string
const parseBody = (body: any = {}) => {
  const data: { title?: string; isActive?: boolean; displayOrder?: number } =
    {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new ApiError(400, "Title must be a non-empty string");
    }
    data.title = body.title.trim();
  }

  if (body.isActive !== undefined) {
    const value = String(body.isActive);
    if (value !== "true" && value !== "false") {
      throw new ApiError(400, "isActive must be true or false");
    }
    data.isActive = value === "true";
  }

  if (body.displayOrder !== undefined) {
    const value = Number(body.displayOrder);
    if (body.displayOrder === "" || !Number.isFinite(value)) {
      throw new ApiError(400, "displayOrder must be a number");
    }
    data.displayOrder = value;
  }

  return data;
};

const assertImage = (file: Express.Multer.File) => {
  if (!file.mimetype.startsWith("image/")) {
    throw new ApiError(400, `${file.fieldname} must be an image`);
  }
};

const uploadImage = async (file: Express.Multer.File) => {
  const uploaded = await uploadOnCloudinary(file.buffer, BANNER_FOLDER);
  return { url: uploaded.secure_url, publicId: uploaded.public_id };
};

const deleteImages = (publicIds: string[]) =>
  Promise.all(
    publicIds.map((publicId) =>
      deleteFromCloudinary(publicId).catch((err) =>
        console.error("Failed to delete banner image:", publicId, err)
      )
    )
  );

const createBanner = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as BannerFiles;
  const desktopFile = files?.desktopImage?.[0];
  const mobileFile = files?.mobileImage?.[0];

  if (!desktopFile || !mobileFile) {
    throw new ApiError(400, "Both desktopImage and mobileImage are required");
  }
  assertImage(desktopFile);
  assertImage(mobileFile);

  const data = parseBody(req.body);
  if (!data.title) {
    throw new ApiError(400, "Title is required");
  }

  const uploaded = await Promise.allSettled([
    uploadImage(desktopFile),
    uploadImage(mobileFile),
  ]);
  const uploadedIds = uploaded.flatMap((r) =>
    r.status === "fulfilled" ? [r.value.publicId] : []
  );

  try {
    const [desktop, mobile] = uploaded;
    if (desktop.status === "rejected") throw desktop.reason;
    if (mobile.status === "rejected") throw mobile.reason;

    const banner = await BannerModel.create({
      ...data,
      desktopImage: desktop.value,
      mobileImage: mobile.value,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, banner, "Banner created successfully"));
  } catch (err) {
    await deleteImages(uploadedIds);
    throw err;
  }
});

const getAllBanners = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit } = req.query;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(50, parseInt(limit as string) || 10);
  const skip = (pageNum - 1) * pageSize;

  const [banners, total] = await Promise.all([
    BannerModel.find().sort({ displayOrder: 1 }).skip(skip).limit(pageSize),
    BannerModel.countDocuments(),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        banners,
        pagination: {
          total,
          page: pageNum,
          limit: pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      },
      "Banners fetched successfully"
    )
  );
});

const getActiveBanners = asyncHandler(async (_req: Request, res: Response) => {
  const banners = await BannerModel.find({ isActive: true }).sort({
    displayOrder: 1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, banners, "Active banners fetched successfully"));
});

const getBannerById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  assertValidId(id);

  const banner = await BannerModel.findById(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, banner, "Banner fetched successfully"));
});

const updateBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  assertValidId(id);

  const files = req.files as BannerFiles;
  const desktopFile = files?.desktopImage?.[0];
  const mobileFile = files?.mobileImage?.[0];
  if (desktopFile) assertImage(desktopFile);
  if (mobileFile) assertImage(mobileFile);

  const data = parseBody(req.body);

  const banner = await BannerModel.findById(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }
  banner.set(data);

  const oldIds: string[] = [];
  const newIds: string[] = [];

  try {
    if (desktopFile) {
      const image = await uploadImage(desktopFile);
      newIds.push(image.publicId);
      oldIds.push(banner.desktopImage.publicId);
      banner.desktopImage = image;
    }
    if (mobileFile) {
      const image = await uploadImage(mobileFile);
      newIds.push(image.publicId);
      oldIds.push(banner.mobileImage.publicId);
      banner.mobileImage = image;
    }

    await banner.save();
  } catch (err) {
    await deleteImages(newIds);
    throw err;
  }

  // Old images go only after the save, so the document never points at a deleted image
  await deleteImages(oldIds);

  return res
    .status(200)
    .json(new ApiResponse(200, banner, "Banner updated successfully"));
});

const deleteBanner = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  assertValidId(id);

  const banner = await BannerModel.findById(id);
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  await Promise.all([
    deleteFromCloudinary(banner.desktopImage.publicId),
    deleteFromCloudinary(banner.mobileImage.publicId),
  ]);
  await banner.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Banner deleted successfully"));
});

const updateBannerStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  assertValidId(id);

  const isActive = req.body?.isActive;
  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "isActive must be a boolean");
  }

  const banner = await BannerModel.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  );
  if (!banner) {
    throw new ApiError(404, "Banner not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        banner,
        `Banner ${isActive ? "activated" : "deactivated"} successfully`
      )
    );
});

const reorderBanners = asyncHandler(async (req: Request, res: Response) => {
  const banners = req.body?.banners;

  if (!Array.isArray(banners) || banners.length === 0) {
    throw new ApiError(400, "banners must be a non-empty array");
  }
  for (const item of banners) {
    if (
      typeof item?.id !== "string" ||
      !mongoose.isValidObjectId(item.id) ||
      typeof item.displayOrder !== "number" ||
      !Number.isFinite(item.displayOrder)
    ) {
      throw new ApiError(
        400,
        "Each banner needs a valid id and a numeric displayOrder"
      );
    }
  }

  await BannerModel.bulkWrite(
    banners.map((item: { id: string; displayOrder: number }) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { displayOrder: item.displayOrder } },
      },
    }))
  );

  const reordered = await BannerModel.find().sort({ displayOrder: 1 });

  return res
    .status(200)
    .json(new ApiResponse(200, reordered, "Banners reordered successfully"));
});

export {
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  reorderBanners,
};
