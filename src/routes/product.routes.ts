import { Router } from "express";
import {
  createProduct,
  getAllProducts,
} from "../controller/product.controller";
import { get } from "http";
const router = Router();
router.route("/create").post((req, res, next) => {
  createProduct(req, res, next);
});
router.route("/get-all").get((req, res, next) => {
  getAllProducts(req, res, next);
});
export default router;
