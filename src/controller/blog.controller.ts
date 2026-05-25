import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/Apiresponse";
import { BlogModel } from "../models/blog.model";
import { uploadOnCloudinary } from "../utils/cloudinary";

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { title, content, excerpt, coverImage, images, tags, categories, isFeatured } = req.body;

  if (!title || !content) {
    throw new ApiError(400, "Title and content are required");
  }

  const baseSlug = generateSlug(title);
  const suffix = Date.now().toString(36);
  const slug = `${baseSlug}-${suffix}`;

  const blog = await BlogModel.create({
    title,
    slug,
    content,
    excerpt: excerpt || content.slice(0, 200),
    coverImage: coverImage || "",
    images: images || [],
    author: user._id,
    tags: tags || [],
    categories: categories || [],
    isFeatured: isFeatured || false,
    status: "draft",
  });

  return res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
});

const getAllBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { category, tag, featured, page, limit } = req.query;

  const filter: Record<string, any> = { status: "published" };

  if (category) filter["categories"] = { $in: [(category as string).trim()] };
  if (tag) filter["tags"] = { $in: [(tag as string).trim()] };
  if (featured === "true") filter["isFeatured"] = true;

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(50, parseInt(limit as string) || 10);
  const skip = (pageNum - 1) * pageSize;

  const [blogs, total] = await Promise.all([
    BlogModel.find(filter)
      .populate("author", "userName fullName")
      .select("-content -comments")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    BlogModel.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      blogs,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
    }, "Blogs fetched successfully")
  );
});

const getBlogBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const blog = await BlogModel.findOneAndUpdate(
    { slug, status: "published" },
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "userName fullName");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully"));
});

const getBlogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Blog Id");
  }

  const blog = await BlogModel.findById(id).populate("author", "userName fullName");

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully"));
});

const updateBlog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Blog Id");
  }

  const { slug, ...updateData } = req.body;
  if (slug) throw new ApiError(400, "Slug cannot be modified directly");

  const blog = await BlogModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
});

const deleteBlog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Blog Id");
  }

  const blog = await BlogModel.findByIdAndDelete(id);

  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  return res.status(200).json(new ApiResponse(200, null, "Blog deleted successfully"));
});

const publishBlog = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Blog Id");
  }

  const blog = await BlogModel.findById(id);
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  const isPublishing = blog.status === "draft";
  blog.status = isPublishing ? "published" : "draft";
  if (isPublishing) blog.publishedAt = new Date();

  await blog.save();

  return res.status(200).json(new ApiResponse(200, blog, `Blog ${isPublishing ? "published" : "unpublished"} successfully`));
});

const searchBlogs = asyncHandler(async (req: Request, res: Response) => {
  const { q, page, limit } = req.query;

  if (!q || !(q as string).trim()) {
    throw new ApiError(400, "Search query 'q' is required");
  }

  const pageNum = Math.max(1, parseInt(page as string) || 1);
  const pageSize = Math.min(50, parseInt(limit as string) || 10);
  const skip = (pageNum - 1) * pageSize;

  const filter = {
    status: "published",
    $text: { $search: (q as string).trim() },
  };

  const [blogs, total] = await Promise.all([
    BlogModel.find(filter, { score: { $meta: "textScore" } })
      .populate("author", "userName fullName")
      .select("-content -comments")
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(pageSize),
    BlogModel.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      blogs,
      pagination: { total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) },
    }, "Search results fetched successfully")
  );
});

const addComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const user = (req as any).user;

  if (!id || id.length < 12) {
    throw new ApiError(400, "Invalid Blog Id");
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  if (!user || !user._id) {
    throw new ApiError(401, "User not authenticated");
  }

  const blog = await BlogModel.findOne({ _id: id, status: "published" });
  if (!blog) {
    throw new ApiError(404, "Blog not found");
  }

  blog.comments.push({
    user: user._id,
    userName: user.userName || user.fullName || "Anonymous",
    content: content.trim(),
    date: new Date(),
  });

  await blog.save();

  return res.status(201).json(new ApiResponse(201, blog.comments, "Comment added successfully"));
});

const uploadBlogImages = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new ApiError(400, "No files uploaded");
  }

  const uploadedImages: { url: string; public_id: string }[] = [];

  for (const file of files) {
    const uploaded = await uploadOnCloudinary(file.buffer);
    if (uploaded?.secure_url) {
      uploadedImages.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
    }
  }

  return res.status(200).json(new ApiResponse(200, uploadedImages, "Images uploaded successfully"));
});

export {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  deleteBlog,
  publishBlog,
  searchBlogs,
  addComment,
  uploadBlogImages,
};
