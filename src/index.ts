import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import userRouter from "./routes/user.routes";

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.use("/api/v1/users", userRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
