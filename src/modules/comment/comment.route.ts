import { Router } from "express";
import { commentController } from "./comment.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { commentValidation } from "./comment.validation";

const router = Router();

// ── Public routes ─────────────────────────────────────

// Get all comments for an idea — paginated + nested replies
router.get(
  "/idea/:ideaId",
  commentController.getCommentsByIdeaId
);

// ── Member routes ─────────────────────────────────────

// Create comment or reply
// parentId থাকলে reply, না থাকলে top-level comment
router.post(
  "/",
  authMiddleware,
  validateRequest(commentValidation.createCommentSchema),
  commentController.createComment
);

// Get my comments
router.get(
  "/my",
  authMiddleware,
  commentController.getMyComments
);

// Update comment (owner only)
router.patch(
  "/:id",
  authMiddleware,
  validateRequest(commentValidation.updateCommentSchema),
  commentController.updateComment
);

// Delete comment (owner or admin)
router.delete(
  "/:id",
  authMiddleware,
  commentController.deleteComment
);

// ── Admin routes ──────────────────────────────────────

// Get all comments with filters
router.get(
  "/admin/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  commentController.getAllCommentsAdmin
);

export const commentRoutes = router;