import { Router } from "express";
import { voteController } from "./vote.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { voteValidation } from "./vote.validation";

const router = Router();

// ── Member routes ─────────────────────────────────────

// Cast vote (UP or DOWN) — same type দিলে toggle করে remove করবে
router.post(
  "/",
  authMiddleware,
  validateRequest(voteValidation.castVoteSchema),
  voteController.castVote
);

// Remove vote explicitly
router.delete(
  "/:ideaId",
  authMiddleware,
  validateRequest(voteValidation.removeVoteSchema),
  voteController.removeVote
);

// Get my votes
router.get(
  "/my",
  authMiddleware,
  voteController.getMyVotes
);

// ── Public routes ─────────────────────────────────────

// Get vote stats for a specific idea
// Optional auth — login থাকলে userVote দেখাবে
router.get(
  "/:ideaId/stats",
  (req, res, next) => {
    if (req.headers.authorization) {
      return authMiddleware(req, res, next);
    }
    next();
  },
  voteController.getVoteStats
);

export const voteRoutes = router;