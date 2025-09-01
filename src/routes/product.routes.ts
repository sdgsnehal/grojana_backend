import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  uploadProductImages,
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
  getAllProducts(req, res, next);
});
export default router;
