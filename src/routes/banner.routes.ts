import { Router } from "express";
import {
  createBanner,
  getAllBanners,
  getActiveBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
  updateBannerStatus,
  reorderBanners,
} from "../controller/banner.controller";
import { upload } from "../middleware/multer.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();

const bannerImages = upload.fields([
  { name: "desktopImage", maxCount: 1 },
  { name: "mobileImage", maxCount: 1 },
]);

// Public
router.route("/active").get(getActiveBanners);

// Admin only (static paths stay above /:id)
router.route("/reorder").patch(verifyAdmin, reorderBanners);
router
  .route("/")
  .post(verifyAdmin, bannerImages, createBanner)
  .get(verifyAdmin, getAllBanners);
router.route("/:id/status").patch(verifyAdmin, updateBannerStatus);
router
  .route("/:id")
  .get(verifyAdmin, getBannerById)
  .patch(verifyAdmin, bannerImages, updateBanner)
  .delete(verifyAdmin, deleteBanner);

export default router;
