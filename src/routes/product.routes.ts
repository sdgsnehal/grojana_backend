import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  uploadProductImages,
  updateProduct,
  addReview,
} from "../controller/product.controller";
import { upload } from "../middleware/multer.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";

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
router.route("/get-all").get((req, res, next) => {
  console.log("get all");
  getAllProducts(req, res, next);
});
router.route("/:id").get((req, res, next) => {
  getProductById(req, res, next);
});
router.route("/:id").put(verifyAdmin, updateProduct);
router.route("/:id/review").post(addReview);
export default router;
