import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { User, IUser } from "../models/user.model";

interface DecodedToken extends JwtPayload {
  _id: string;
}

export const verifyJwt = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token =
        req.cookies?.accessToken ||
        req.headers?.authorization?.replace("Bearer ", "");
      if (!token) {
        throw new ApiError(401, "Unauthorized request");
      }

      const decodedToken = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as DecodedToken;

      const user = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
      );

      if (!user) {
        throw new ApiError(404, "User not found");
      }

      req.user = user;
      next();
    } catch (error: any) {
      throw new ApiError(401, error?.message || "Unauthorized request");
    }
  }
);
