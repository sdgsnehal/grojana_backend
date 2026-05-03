import { Router } from "express";
import {
  createSeller,
  getAllSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
} from "../controller/seller.controller";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();

router.route("/create").post(verifyAdmin, createSeller);
router.route("/get-all").get(verifyAdmin, getAllSellers);
router.route("/:id").get(verifyAdmin, getSellerById);
router.route("/:id").put(verifyAdmin, updateSeller);
router.route("/:id").delete(verifyAdmin, deleteSeller);

export default router;
