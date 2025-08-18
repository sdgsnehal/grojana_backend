import { Router } from "express";
import { createProduct } from "../controller/product.controller";
const router = Router();
router.route("/create").post((req, res, next) => {
  createProduct(req, res, next);
});
export default router;
