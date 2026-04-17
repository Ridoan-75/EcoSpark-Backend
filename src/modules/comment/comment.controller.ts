// Controller for comment management endpoints.
import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { commentService } from "./comment.service";
import httpStatus from "http-status";

// Create Comment or Reply
const createComment = catchAsync(async (req: Request, res: Response) => {
  const result = await commentService.createComment(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: req.body.parentId
      ? "Reply added successfully"
      : "Comment added successfully",
    data: result,
  });
});

// ── Get Comments for an Idea (Public) ─────────────────
const getCommentsByIdeaId = catchAsync(async (req: Request, res: Response) => {
  const result = await commentService.getCommentsByIdeaId(
    req.params.ideaId as string,
    req.query
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comments fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Update Comment (Owner) ────────────────────────────
const updateComment = catchAsync(async (req: Request, res: Response) => {
  const result = await commentService.updateComment(
    req.params.id as string,
    req.user!.id,
    req.body.body
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment updated successfully",
    data: result,
  });
});

// ── Delete Comment (Owner or Admin) ───────────────────
const deleteComment = catchAsync(async (req: Request, res: Response) => {
  await commentService.deleteComment(
    req.params.id as string,
    req.user!.id,
    req.user!.role
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Comment deleted successfully",
    data: null,
  });
});

// ── Get All Comments Admin ────────────────────────────
const getAllCommentsAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await commentService.getAllCommentsAdmin(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All comments fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Get My Comments (Member) ──────────────────────────
const getMyComments = catchAsync(async (req: Request, res: Response) => {
  const result = await commentService.getMyComments(req.user!.id, req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your comments fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const commentController = {
  createComment,
  getCommentsByIdeaId,
  updateComment,
  deleteComment,
  getAllCommentsAdmin,
  getMyComments,
};