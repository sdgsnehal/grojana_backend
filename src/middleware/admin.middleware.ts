import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";
import { ApiError } from "../utils/ApiError";

export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(req);
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token missing" });

  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!) as {
      email?: string;
    };

    if (
      decoded?.email &&
      ["sdgsnehal@gmail.com", "ankitshanivare@gmail.com"].includes(
        decoded.email
      )
    ) {
      // Map decoded info to IUser shape (partial)
      req.user = { email: decoded.email } as IUser;
      next();
    }
    return res.status(403).json({ error: "Not an admin" });
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Unauthorized request");
  }
}
