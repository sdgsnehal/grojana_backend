import { Router } from "express";
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
  saveAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
  updateUserDetails,
  forgotPassword,
  resetPassword,
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from "../controller/user.controller";

import { verifyJwt } from "../middleware/auth.middleware";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/save-address").post(verifyJwt, saveAddress);
router.route("/getaddresses").get(verifyJwt, getAddresses);
router.route("/address/:addressId").put(verifyJwt, updateAddress);
router.route("/address/:addressId").delete(verifyJwt, deleteAddress);
router.route("/update-details").put(verifyJwt, updateUserDetails);
router.route("/wishlist").get(verifyJwt, getWishlist);
router.route("/wishlist/:productId").post(verifyJwt, addToWishlist);
router.route("/wishlist/:productId").delete(verifyJwt, removeFromWishlist);
//secured routes

export default router;
