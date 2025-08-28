import jwt, { JwtPayload } from "jsonwebtoken";
import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User, IUser } from "../models/user.model";
import { ApiResponse } from "../utils/Apiresponse";
import { Address } from "../models/address.model";

// Helper to generate both tokens
const generateAccessTokenAndRefreshToken = async (
  userId: mongoose.Types.ObjectId
): Promise<{ accessToken: string; refreshToken: string }> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found while generating tokens");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// Register
const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, userName, password } = req.body;

  if ([email, userName, password].some((f) => !f?.trim())) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ userName }, { email }] });
  if (existedUser) {
    throw new ApiError(409, "User already exists");
  }

  const newUser = await User.create({
    email,
    userName,
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

// Login
const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { userName, password, email } = req.body;

  if (!(userName || email)) {
    throw new ApiError(400, "Username or Email is required");
  }

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Password is incorrect");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

// Refresh token
const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload & { _id: string };

    const user = await User.findById(decoded._id);
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or invalid");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error: any) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

// Logout
const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const saveAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id; // assuming you attach user in auth middleware
  if (!userId) throw new ApiError(401, "Unauthorized");

  const { name, mobile, streetAddress, address, city, state, zip } = req.body;

  if (
    ![name, mobile, streetAddress, address, city, state, zip].every(Boolean)
  ) {
    throw new ApiError(400, "All address fields are required");
  }

  const user = await User.findById(userId).populate("addresses");
  if (!user) throw new ApiError(404, "User not found");

  if (user.addresses.length >= 5) {
    throw new ApiError(400, "You can save maximum 5 addresses");
  }

  // Create address
  const newAddress = await Address.create({
    name,
    mobile,
    streetAddress,
    address,
    city,
    state,
    zip,
  });

  // Push into user
  user.addresses.push(newAddress._id);
  await user.save();

  return res
    .status(201)
    .json(new ApiResponse(201, newAddress, "Address saved successfully"));
});
const getAddresses = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id; // comes from auth middleware
  if (!userId) throw new ApiError(401, "Unauthorized");

  const user = await User.findById(userId).populate("addresses");
  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user.addresses, "Addresses fetched successfully")
    );
});
const updateAddress = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id; // set by auth middleware
  const { addressId } = req.params; // from route param
  const { name, mobile, streetAddress, address, city, state, zip } = req.body;

  if (!userId) throw new ApiError(401, "Unauthorized");

  // Ensure the address exists in user's list
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.addresses.includes(addressId as any)) {
    throw new ApiError(403, "This address does not belong to you");
  }

  // Update the address
  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    { name, mobile, streetAddress, address, city, state, zip },
    { new: true, runValidators: true }
  );

  if (!updatedAddress) {
    throw new ApiError(404, "Address not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAddress, "Address updated successfully"));
});
// (Other handlers like changeCurrentPassword, updateUserAvatar, etc. would be similarly typed)

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  saveAddress,
  getAddresses,
  updateAddress,
};
