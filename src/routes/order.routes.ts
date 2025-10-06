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
} from "../controller/order.controller";
import { verifyJwt } from "../middleware/auth.middleware";

const router = Router();

// User routes (protected)
router.route("/create").post(verifyJwt, createOrder);
router.route("/verify-payment").post(verifyJwt, verifyPayment);
router.route("/my-orders").get(verifyJwt, getOrders);
router.route("/:orderId").get(verifyJwt, getOrderById);
router.route("/:orderId/cancel").put(verifyJwt, cancelOrder);

// Admin routes (these would typically have admin middleware)
router.route("/admin/all").get(getAllOrders);
router.route("/admin/stats").get(getOrderStats);
router.route("/admin/:orderId").get(getOrderByIdAdmin);
router.route("/status/:status").get(getOrdersByStatus);
router.route("/:orderId/update-status").put(updateOrderStatus);

export default router;