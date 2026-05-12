import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductById,
  uploadProductImages,
  updateProduct,
  addReview,
} from "../controller/product.controller";
import { upload } from "../middleware/multer.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";
import { verifyJwt } from "../middleware/auth.middleware";

const router = Router();
router.route("/create").post(verifyAdmin, createProduct);
router.route("/upload-images").post((req, res, next) => {
  upload.array("image")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    uploadProductImages(req, res, next);
  });
});
router.route("/get-all").get(getAllProducts);
router.route("/category/:category").get(getProductsByCategory);
router.route("/:id").get((req, res, next) => {
  getProductById(req, res, next);
});
router.route("/:id").put(verifyAdmin, updateProduct);
router.route("/:id/review").post(verifyJwt, (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) return next(err);
    addReview(req, res, next);
  });
});
export default router;
