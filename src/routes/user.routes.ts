import { Router } from "express";
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  logoutUser,
  saveAddress,
  getAddresses,
  updateAddress,
  updateUserDetails,
} from "../controller/user.controller";

import { verifyJwt } from "../middleware/auth.middleware";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/save-address").post(verifyJwt, saveAddress);
router.route("/getaddresses").get(verifyJwt, getAddresses);
router.route("/address/:addressId").put(verifyJwt, updateAddress);
router.route("/update-details").put(verifyJwt, updateUserDetails);
//secured routes

export default router;
