import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { uploadToCloudinary } from "../../utils/imageUpload";

// ── Get All Users (Admin) ─────────────────────────────
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Get Single User (Admin) ───────────────────────────
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await userService.getUserById(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});

// ── Update User Status (Admin) ────────────────────────
const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await userService.updateUserStatus(
    userId,
    req.body.isActive
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `User ${req.body.isActive ? "activated" : "deactivated"} successfully`,
    data: result,
  });
});

// ── Update User Role (Admin) ──────────────────────────
const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await userService.updateUserRole(
    userId,
    req.body.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

// ── Get My Profile (Member) ───────────────────────────
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getMyProfile(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: result,
  });
});

// ── Update My Profile (Member) ────────────────────────
const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  let profileImage: string | undefined;

  // Profile image upload হয়েছে কিনা check করো
  if (req.file) {
    const uploaded = await uploadToCloudinary(req.file.buffer, "profiles");
    profileImage = uploaded.url;
  }

  const result = await userService.updateMyProfile(req.user!.id, {
    ...req.body,
    ...(profileImage && { profileImage }),
  });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully",
    data: result,
  });
});


// ── Delete My Account (Member) ────────────────────────
const deleteMyAccount = catchAsync(async (req: Request, res: Response) => {
  await userService.deleteMyAccount(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Account deactivated successfully",
    data: null,
  });
});

export const userController = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
};