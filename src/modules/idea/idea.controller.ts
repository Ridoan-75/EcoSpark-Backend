import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ideaService } from "./idea.service";
import httpStatus from "http-status";
import {
  uploadMultipleToCloudinary,
} from "../../utils/imageUpload";

// ── Create Idea (Member) ──────────────────────────────
const createIdea = catchAsync(async (req: Request, res: Response) => {
  let imageUrls: string[] = [];

  // File upload হয়েছে কিনা check
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    imageUrls = await uploadMultipleToCloudinary(
      req.files as Express.Multer.File[],
      "ideas"
    );
  }

  // body তে images থাকলে (existing URLs) সেগুলোও রাখো
  const bodyImages = req.body.images;
  const existingImages = bodyImages
    ? Array.isArray(bodyImages)
      ? bodyImages
      : [bodyImages]
    : [];

  const allImages = [...existingImages, ...imageUrls];

  const result = await ideaService.createIdea(req.user!.id, {
    title: req.body.title,
    problemStatement: req.body.problemStatement,
    proposedSolution: req.body.proposedSolution,
    description: req.body.description,
    categoryId: req.body.categoryId,
    isPaid: req.body.isPaid === "true" || req.body.isPaid === true,
    price: req.body.price ? Number(req.body.price) : null,
    images: allImages,
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Idea created successfully as draft",
    data: result,
  });
});

// ── Get All Approved Ideas (Public) ───────────────────
const getAllIdeas = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getAllIdeas(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ideas fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Get Single Idea ───────────────────────────────────
const getIdeaById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await ideaService.getIdeaById(req.params.id as string, userId);

  // Paid idea কিন্তু payment করেনি — proposedSolution hide করো
  const finalResult = req.requiresPaidAccess 
    ? {
        ...result,
        proposedSolution: "[This is a paid idea - Purchase to view solution]",
        isPaidAndNotPurchased: true,
      }
    : result;

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea fetched successfully",
    data: finalResult,
  });
});

// ── Get My Ideas (Member) ─────────────────────────────
const getMyIdeas = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getMyIdeas(req.user!.id, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your ideas fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Get All Ideas Admin ───────────────────────────────
const getAllIdeasAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.getAllIdeasAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All ideas fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Update Idea (Member) ──────────────────────────────
const updateIdea = catchAsync(async (req: Request, res: Response) => {
  let imageUrls: string[] = [];

  // নতুন files upload হয়েছে কিনা check করো
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    imageUrls = await uploadMultipleToCloudinary(
      req.files as Express.Multer.File[],
      "ideas"
    );
  }

  // Existing image URLs body তে থাকলে রাখো
  const existingImages = req.body.images
    ? Array.isArray(req.body.images)
      ? req.body.images
      : [req.body.images]
    : [];

  const allImages =
    existingImages.length > 0 || imageUrls.length > 0
      ? [...existingImages, ...imageUrls]
      : undefined;

  const result = await ideaService.updateIdea(
    req.params.id as string,
    req.user!.id,
    {
      ...req.body,
      ...(req.body.isPaid !== undefined && {
        isPaid: req.body.isPaid === "true" || req.body.isPaid === true,
      }),
      ...(req.body.price !== undefined && {
        price: req.body.price ? Number(req.body.price) : null,
      }),
      ...(allImages && { images: allImages }),
    }
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea updated successfully",
    data: result,
  });
});

// ── Submit Idea for Review ────────────────────────────
const submitIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.submitIdea(req.params.id as string, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea submitted for review successfully",
    data: result,
  });
});

// ── Approve Idea (Admin) ──────────────────────────────
const approveIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.approveIdea(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea approved successfully",
    data: result,
  });
});

// ── Reject Idea (Admin) ───────────────────────────────
const rejectIdea = catchAsync(async (req: Request, res: Response) => {
  const result = await ideaService.rejectIdea(
    req.params.id as string,
    req.body.rejectionFeedback
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea rejected with feedback",
    data: result,
  });
});

// ── Delete Idea (Member) ──────────────────────────────
const deleteIdea = catchAsync(async (req: Request, res: Response) => {
  await ideaService.deleteIdea(req.params.id as string, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea deleted successfully",
    data: null,
  });
});

// ── Delete Idea Admin ─────────────────────────────────
const deleteIdeaAdmin = catchAsync(async (req: Request, res: Response) => {
  await ideaService.deleteIdeaAdmin(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Idea deleted successfully",
    data: null,
  });
});

// ── Get Top Voted Ideas ───────────────────────────────
const getTopVotedIdeas = catchAsync(async (req: Request, res: Response) => {
  const limit = Number(req.query.limit) || 3;
  const result = await ideaService.getTopVotedIdeas(limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Top voted ideas fetched successfully",
    data: result,
  });
});

export const ideaController = {
  createIdea,
  getAllIdeas,
  getIdeaById,
  getMyIdeas,
  getAllIdeasAdmin,
  updateIdea,
  submitIdea,
  approveIdea,
  rejectIdea,
  deleteIdea,
  deleteIdeaAdmin,
  getTopVotedIdeas,
};