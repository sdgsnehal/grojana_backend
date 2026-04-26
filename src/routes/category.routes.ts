import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controller/category.controller";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();

router.route("/create").post(verifyAdmin, createCategory);
router.route("/get-all").get(getAllCategories);
router.route("/:id").get(getCategoryById);
router.route("/:id").put(verifyAdmin, updateCategory);
router.route("/:id").delete(verifyAdmin, deleteCategory);

export default router;
