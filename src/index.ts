/// <reference path="./express.d.ts" />
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";
import productRouter from "./routes/product.routes";

connectDB();

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // ✅ frontend URL
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
