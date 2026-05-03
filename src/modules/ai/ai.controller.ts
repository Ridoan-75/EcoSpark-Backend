import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import {
  getUserRecommendationsService,
  getSimilarIdeasService,
  getSearchSuggestionsService,
  getTrendingIdeasService,
  aiChatService,
} from "./ai.service";

export const getUserRecommendations = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getUserRecommendationsService(req.params.userId as string);
    sendResponse(res, { statusCode: 200, success: true, message: "Recommendations fetched", data: result });
  },
);

export const getSimilarIdeas = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getSimilarIdeasService(req.params.ideaId as string);
    sendResponse(res, { statusCode: 200, success: true, message: "Similar ideas fetched", data: result });
  },
);

export const getSearchSuggestions = catchAsync(
  async (req: Request, res: Response) => {
    const query = req.query.q as string;
    const result = await getSearchSuggestionsService(query);
    sendResponse(res, { statusCode: 200, success: true, message: "Suggestions fetched", data: result });
  },
);

export const getTrendingIdeas = catchAsync(
  async (req: Request, res: Response) => {
    const result = await getTrendingIdeasService();
    sendResponse(res, { statusCode: 200, success: true, message: "Trending ideas fetched", data: result });
  },
);

export const aiChat = catchAsync(async (req: Request, res: Response) => {
  const result = await aiChatService(req.user!.id, req.body.message);
  sendResponse(res, { statusCode: 200, success: true, message: "AI response", data: result });
});
