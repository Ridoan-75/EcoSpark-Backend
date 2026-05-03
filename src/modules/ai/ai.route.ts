import { Router } from "express";
import {
  getUserRecommendations,
  getSimilarIdeas,
  getSearchSuggestions,
  getTrendingIdeas,
  aiChat,
} from "./ai.controller";
import authMiddleware from "../../middlewares/auth.middleware";

const router = Router();

// ─── Public ────────────────────────────────────────────────────────────────────
router.get("/similar/:ideaId", getSimilarIdeas);
router.get("/search-suggestions", getSearchSuggestions);
router.get("/trending", getTrendingIdeas);

// ─── Auth ──────────────────────────────────────────────────────────────────────
router.get("/recommendations/:userId", authMiddleware, getUserRecommendations);
router.post("/chat", authMiddleware, aiChat);

export default router;
