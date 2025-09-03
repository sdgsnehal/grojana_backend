import { Request, Response, NextFunction } from "express";
import { OAuth2Client } from "google-auth-library";
import { User, IUser } from "../models/user.model";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // 👈 must match
    });

    const payload = ticket.getPayload();
    if (
      payload?.email &&
      ["sdgsnehal@gmail.com", "ankitshanivare@gmail.com"].includes(
        payload.email
      )
    ) {
      req.user = { email: payload.email } as IUser;
      return next();
    }

    return res.status(403).json({ error: "Not an admin" });
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}
