import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import httpStatus from "http-status";

// ── Initiate Payment ──────────────────────────────────
const initiatePayment = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.initiatePayment(
    req.user!.id,
    req.body.ideaId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment session created successfully",
    data: result,
  });
});

// ── Stripe Webhook ────────────────────────────────────
// RAW body লাগবে — express.json() bypass করতে হবে
const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;

  try {
    const result = await paymentService.handleStripeWebhook(
      req.body as Buffer,
      signature
    );
    res.status(200).json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ── Verify Payment ────────────────────────────────────
const verifyPayment = catchAsync(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const result = await paymentService.verifyPayment(sessionId as string, req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payment verified successfully",
    data: result,
  });
});

// ── Get My Payments (Member) ──────────────────────────
const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getMyPayments(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your payments fetched successfully",
    data: result,
  });
});

// ── Get All Payments (Admin) ──────────────────────────
const getAllPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.getAllPayments(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "All payments fetched successfully",
    meta: result.meta,
    data: {
      payments: result.data,
      stats: result.stats,
    },
  });
});

// ── Check Access ──────────────────────────────────────
const checkAccess = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.checkAccess(
    req.user!.id,
    req.params.ideaId as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access check completed",
    data: result,
  });
});

export const paymentController = {
  initiatePayment,
  stripeWebhook,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  checkAccess,
};