import { Router } from "express";
import { paymentController } from "./payment.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { paymentValidation } from "./payment.validation";
import express from "express";

const router = Router();

// ── Stripe Webhook ─────────────────────────────────────
// IMPORTANT: raw body লাগবে — এটা সবার আগে রাখো
// express.json() এর আগে raw body parse করতে হবে
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  paymentController.stripeWebhook
);

// ── Member routes ─────────────────────────────────────

// Payment initiate করো — Stripe checkout session তৈরি হবে
router.post(
  "/initiate",
  authMiddleware,
  validateRequest(paymentValidation.initiatePaymentSchema),
  paymentController.initiatePayment
);

// Payment verify করো — success page থেকে call হবে
router.get(
  "/verify/:sessionId",
  authMiddleware,
  paymentController.verifyPayment
);

// আমার সব payments
router.get(
  "/my",
  authMiddleware,
  paymentController.getMyPayments
);

// Specific idea তে access আছে কিনা check করো
router.get(
  "/access/:ideaId",
  authMiddleware,
  paymentController.checkAccess
);

// ── Admin routes ──────────────────────────────────────
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  paymentController.getAllPayments
);

export const paymentRoutes = router;