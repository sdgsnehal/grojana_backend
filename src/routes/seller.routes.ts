import { Router } from "express";
import {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
  getSellerProducts,
} from "../controller/seller.controller";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();

router.route("/create").post(verifyAdmin, createSeller);
router.route("/get-all").get(verifyAdmin, getAllSellers);
router.route("/:id").get(verifyAdmin, getSellerById);
router.route("/:id").put(verifyAdmin, updateSeller);
router.route("/:id").delete(verifyAdmin, deleteSeller);
router.route("/:id/products").get(getSellerProducts);

export default router;
