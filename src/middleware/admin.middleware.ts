import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { IUser } from "../models/user.model";

export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
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
      return next();
    }

    return res.status(403).json({ error: "Not admin" });
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
}
