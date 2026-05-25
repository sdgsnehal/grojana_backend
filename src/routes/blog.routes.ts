import { Router } from "express";
import {
  createBlog,
  getAdminBlogs,
  getAllBlogs,
  getBlogBySlug,
  getBlogById,
  updateBlog,
  deleteBlog,
  publishBlog,
  searchBlogs,
  addComment,
  uploadBlogImages,
} from "../controller/blog.controller";
import { upload } from "../middleware/multer.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";
import { verifyJwt } from "../middleware/auth.middleware";

const router = Router();
console.log("blog routes loaded");
// Public
router.route("/get-all").get(getAllBlogs);
router.route("/search").get(searchBlogs);
router.route("/slug/:slug").get(getBlogBySlug);
router.route("/:id").get(getBlogById);

// Admin only
router.route("/admin/get-all").get(verifyAdmin, getAdminBlogs);
router.route("/create").post(verifyAdmin, createBlog);
router.route("/upload-images").post(verifyAdmin, (req, res, next) => {
  upload.array("images")(req, res, (err) => {
    if (err) return next(err);
    uploadBlogImages(req, res, next);
  });
});
router.route("/:id").put(verifyAdmin, updateBlog);
router.route("/:id").delete(verifyAdmin, deleteBlog);
router.route("/:id/publish").patch(verifyAdmin, publishBlog);

// Authenticated users
router.route("/:id/comment").post(verifyJwt, addComment);

export default router;
