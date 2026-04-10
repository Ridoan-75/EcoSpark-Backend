import { Router } from "express";
import { newsletterController } from "./newsletter.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { newsletterValidation } from "./newsletter.validation";

const router = Router();

// ── Public routes ─────────────────────────────────────
router.post(
  "/subscribe",
  validateRequest(newsletterValidation.subscribeSchema),
  newsletterController.subscribe
);

router.post(
  "/unsubscribe",
  validateRequest(newsletterValidation.unsubscribeSchema),
  newsletterController.unsubscribe
);

// ── Admin routes ──────────────────────────────────────
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  newsletterController.getAllSubscribers
);

router.delete(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  newsletterController.deleteSubscriber
);

export const newsletterRoutes = router;