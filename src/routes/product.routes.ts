import { Router } from "express";
import {
  createProduct,
  getAllProducts,
} from "../controller/product.controller";
import { upload } from "../middleware/multer.middleware";

const router = Router();
router.route("/create").post((req, res, next) => {
  upload.array("image")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    createProduct(req, res, next);
  });
});
router.route("/get-all").get((req, res, next) => {
  getAllProducts(req, res, next);
});
export default router;
