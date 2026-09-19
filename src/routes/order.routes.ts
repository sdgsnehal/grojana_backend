import { Router } from "express";
import {
  createOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByStatus,
  getAllOrders,
  getOrderByIdAdmin,
  getOrderStats,
  generateShippingReport,
} from "../controller/order.controller";
import { verifyJwt } from "../middleware/auth.middleware";
import { verifyAdmin } from "../middleware/admin.middleware";

const router = Router();

// User routes (protected)
router.route("/create").post(verifyJwt, createOrder);
router.route("/verify-payment").post(verifyJwt, verifyPayment);
router.route("/my-orders").get(verifyJwt, getOrders);
router.route("/:orderId").get(verifyJwt, getOrderById);
router.route("/:orderId/cancel").put(verifyJwt, cancelOrder);

// Admin routes
router.route("/admin/all").get(verifyAdmin, getAllOrders);
router.route("/admin/stats").get(verifyAdmin, getOrderStats);
router.route("/admin/:orderId").get(verifyAdmin, getOrderByIdAdmin);
router.route("/status/:status").get(verifyAdmin, getOrdersByStatus);
router.route("/:orderId/update-status").put(verifyAdmin, updateOrderStatus);
router.route("/shipping-report").post(verifyAdmin, generateShippingReport);

export default router;