import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  uploadProductImages,
} from "../controller/product.controller";
import { upload } from "../middleware/multer.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();
router.route("/create").post((req, res, next) => {
  verifyAdmin(req, res, next),
    upload.single("image")(req, res, (err) => {
      if (err) {
        return next(err);
      }
      createProduct(req, res, next);
    });
});
router.route("/upload-images").post((req, res, next) => {
  console.log("Inside upload images route");
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
