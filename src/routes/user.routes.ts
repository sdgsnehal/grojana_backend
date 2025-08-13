import { Router } from "express";
import {
  loginUser,
  registerUser,
  refreshAccessToken,
} from "../controller/user.controller";

import { verifyJwt } from "../middleware/auth.middleware";
const router = Router();
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
//secured routes

export default router;
