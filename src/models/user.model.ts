import mongoose, { Schema, Document, Model, Types } from "mongoose";
import jwt, { SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";

// Define the user interface for TypeScript
export interface IUser extends Document {
  _id: Types.ObjectId;
  userName: string;
  email: string;
  password: string;
  refreshToken?: string;
  addresses: Types.ObjectId[];

  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    addresses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Address",
      },
    ],
  },
  { timestamps: true }
);

// ✅ Limit addresses to max 5
userSchema.path("addresses").validate(function (arr: Types.ObjectId[]) {
  return arr.length <= 5;
}, "Maximum 5 addresses allowed");

// Hash password before save
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare passwords
userSchema.methods.isPasswordCorrect = async function (password: string) {
  if (!password || !this.password) {
    return false;
  }
  console.log(password, this.password);
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function (): string {
  const secret = process.env.ACCESS_TOKEN_SECRET;
  if (!secret) throw new Error("ACCESS_TOKEN_SECRET is not set");
  const options: SignOptions = {
    expiresIn: (process.env.ACCESS_TOKEN_EXPIRY || "15m") as any,
  };

  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    secret,
    options
  );
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function (): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new Error("REFRESH_TOKEN_SECRET is not set");
  const options: SignOptions = {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRY || "7d") as any,
  };

  return jwt.sign(
    {
      _id: this._id,
    },
    secret,
    options
  );
};

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
