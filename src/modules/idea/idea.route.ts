import { Router } from "express";
import { ideaController } from "./idea.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { ideaValidation } from "./idea.validation";
import paidIdeaMiddleware from "../../middlewares/paidIdea.middleware";
import { uploadMultiple } from "../../utils/imageUpload";

const router = Router();

// ── Public routes ─────────────────────────────────────
router.get(
  "/",
  ideaController.getAllIdeas
);

router.get(
  "/top-voted",
  ideaController.getTopVotedIdeas
);

// ── Member routes ─────────────────────────────────────
router.post(
  "/",
  authMiddleware,
  roleMiddleware("MEMBER"),
  uploadMultiple,                               // image upload middleware
  validateRequest(ideaValidation.createIdeaSchema),
  ideaController.createIdea
);

router.get(
  "/my",
  authMiddleware,
  ideaController.getMyIdeas
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("MEMBER"),
  uploadMultiple,                               // image upload middleware
  validateRequest(ideaValidation.updateIdeaSchema),
  ideaController.updateIdea
);

router.patch(
  "/:id/submit",
  authMiddleware,
  roleMiddleware("MEMBER"),
  ideaController.submitIdea
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("MEMBER"),
  ideaController.deleteIdea
);

// ── Admin routes ──────────────────────────────────────
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  ideaController.getAllIdeasAdmin
);

router.patch(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  ideaController.approveIdea
);

router.patch(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validateRequest(ideaValidation.rejectIdeaSchema),
  ideaController.rejectIdea
);

router.delete(
  "/admin/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  ideaController.deleteIdeaAdmin
);

// ── Single idea — সবার শেষে রাখো ─────────────────────
// authMiddleware optional — token থাকলে user পাবো, না থাকলেও চলবে
router.get(
  "/:id",
  (req, res, next) => {
    // Token থাকলে user attach করো, না থাকলেও next() call করো
    if (req.headers.authorization) {
      return authMiddleware(req, res, next);
    }
    next();
  },
  paidIdeaMiddleware,                           // paid check middleware
  ideaController.getIdeaById
);

export const ideaRoutes = router;