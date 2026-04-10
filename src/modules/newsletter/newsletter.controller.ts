import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { newsletterService } from "./newsletter.service";
import httpStatus from "http-status";

// ── Subscribe (Public) ────────────────────────────────
const subscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await newsletterService.subscribe(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: result.message,
    data: result.newsletter,
  });
});

// ── Unsubscribe (Public) ──────────────────────────────
const unsubscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await newsletterService.unsubscribe(req.body.email);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Unsubscribed successfully",
    data: result,
  });
});

// ── Get All Subscribers (Admin) ───────────────────────
const getAllSubscribers = catchAsync(async (req: Request, res: Response) => {
  const result = await newsletterService.getAllSubscribers(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscribers fetched successfully",
    meta: result.meta,
    data: {
      subscribers: result.data,
      stats: result.stats,
    },
  });
});

// ── Delete Subscriber (Admin) ─────────────────────────
const deleteSubscriber = catchAsync(async (req: Request, res: Response) => {
  await newsletterService.deleteSubscriber(req.params.id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscriber deleted successfully",
    data: null,
  });
});

export const newsletterController = {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  deleteSubscriber,
};