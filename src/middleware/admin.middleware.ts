import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User } from "../models/user.model";

export const ADMIN_EMAILS = ["sdgsnehal@gmail.com", "ankitshanivare@gmail.com"];

interface DecodedToken extends JwtPayload {
  _id: string;
  email: string;
}

export async function verifyAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.accessToken ||
    req.headers?.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as DecodedToken;

    if (!ADMIN_EMAILS.includes(decoded.email)) {
      return res.status(403).json({ error: "Not an admin" });
    }

    const dbUser = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    if (!dbUser) return res.status(403).json({ error: "Admin user not found in DB" });

    req.user = dbUser;
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
