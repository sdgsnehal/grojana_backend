import { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/Apiresponse";
import { OrderModel, IOrder } from "../models/order.model";
import { User } from "../models/user.model";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Items are required");
  }

  if (!shippingAddress) {
    throw new ApiError(400, "Shipping address is required");
  }

  if (!paymentMethod) {
    throw new ApiError(400, "Payment method is required");
  }

  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Create order in database
  const order = await OrderModel.create({
    user: userId,
    items,
    totalAmount,
    shippingAddress,
    paymentMethod,
    paymentStatus: paymentMethod === "cash_on_delivery" ? "pending" : "pending",
    orderStatus: "pending",
  });

  // If payment method is online, create Razorpay order
  let razorpayOrder = null;
  if (paymentMethod === "online_payment") {
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: "INR",
        notes: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      });
    } catch (error) {
      await OrderModel.findByIdAndDelete(order._id);
      throw new ApiError(500, "Failed to create Razorpay order");
    }
  }

  const populatedOrder = await OrderModel.findById(order._id).populate(
    "items.product"
  );

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        order: populatedOrder,
        razorpayOrder: razorpayOrder,
      },
      "Order created successfully"
    )
  );
});

const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
    throw new ApiError(400, "Missing payment verification parameters");
  }

  try {
    // Verify Razorpay signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      // Update order status to failed
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
      });
      throw new ApiError(400, "Invalid signature");
    }

    // Fetch payment details from Razorpay to double-check
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (payment.status !== "captured") {
      // Update order status to failed
      await OrderModel.findByIdAndUpdate(orderId, {
        paymentStatus: "failed",
      });
      throw new ApiError(400, "Payment not captured");
    }

    // Update order status to completed
    const updatedOrder = await OrderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "completed",
        orderStatus: "confirmed",
      },
      { new: true }
    ).populate("items.product");

    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedOrder, "Payment verified successfully")
      );
  } catch (error: any) {
    // Update order status to failed
    await OrderModel.findByIdAndUpdate(orderId, {
      paymentStatus: "failed",
    });
    throw new ApiError(400, "Payment verification failed");
  }
});

const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) throw new ApiError(401, "Unauthorized");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const orders = await OrderModel.find({ user: userId })
    .populate("items.product")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await OrderModel.countDocuments({ user: userId });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1,
        },
      },
      "Orders fetched successfully"
    )
  );
});

const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { orderId } = req.params;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const order = await OrderModel.findOne({
    _id: orderId,
    user: userId,
  }).populate("items.product");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order fetched successfully"));
});

const updateOrderStatus = asyncHandler(async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const { orderStatus, trackingNumber, estimatedDeliveryDate, notes } =
    req.body;

  if (!orderStatus) {
    throw new ApiError(400, "Order status is required");
  }

  const updateData: Partial<IOrder> = { orderStatus };

  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (estimatedDeliveryDate)
    updateData.estimatedDeliveryDate = new Date(estimatedDeliveryDate);
  if (notes) updateData.notes = notes;

  // Set delivery date if status is delivered
  if (orderStatus === "delivered") {
    updateData.deliveredAt = new Date();
  }

  // Set cancellation date if status is cancelled
  if (orderStatus === "cancelled") {
    updateData.cancelledAt = new Date();
  }

  const order = await OrderModel.findByIdAndUpdate(orderId, updateData, {
    new: true,
    runValidators: true,
  }).populate("items.product");

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully"));
});

const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");

  const order = await OrderModel.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Check if order can be cancelled
  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    throw new ApiError(400, "Order cannot be cancelled at this stage");
  }

  // Update order status
  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  if (reason) order.notes = reason;

  // If payment was completed, mark it for refund
  if (order.paymentStatus === "completed") {
    order.paymentStatus = "refunded";
  }

  await order.save();

  const updatedOrder = await OrderModel.findById(orderId).populate(
    "items.product"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedOrder, "Order cancelled successfully"));
});

const getOrdersByStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    throw new ApiError(400, "Invalid order status");
  }

  const orders = await OrderModel.find({ orderStatus: status })
    .populate("items.product")
    .populate("user", "userName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await OrderModel.countDocuments({ orderStatus: status });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: page < Math.ceil(totalOrders / limit),
          hasPrevPage: page > 1,
        },
      },
      `Orders with status '${status}' fetched successfully`
    )
  );
});

const getOrderStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await OrderModel.aggregate([
    {
      $group: {
        _id: "$orderStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  const paymentStats = await OrderModel.aggregate([
    {
      $group: {
        _id: "$paymentStatus",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmount" },
      },
    },
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orderStats: stats,
        paymentStats: paymentStats,
      },
      "Order statistics fetched successfully"
    )
  );
});

export {
  createOrder,
  verifyPayment,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByStatus,
  getOrderStats,
};
