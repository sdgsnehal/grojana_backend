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
const allowedOrigins = [
  process.env.CORS_ORIGIN_FRONTEND,
  process.env.CORS_ORIGIN_ADMIN,
].filter(Boolean) as string[];
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
