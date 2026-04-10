import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { voteService } from "./vote.service";
import httpStatus from "http-status";

// ── Cast Vote ─────────────────────────────────────────
const castVote = catchAsync(async (req: Request, res: Response) => {
  const result = await voteService.castVote(req.user!.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: {
      vote: result.vote,
      voteStats: result.voteStats,
    },
  });
});

// ── Remove Vote ───────────────────────────────────────
const removeVote = catchAsync(async (req: Request, res: Response) => {
  const result = await voteService.removeVote(
    req.user!.id,
    req.params.ideaId as string
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vote removed successfully",
    data: result,
  });
});

// ── Get Vote Stats (Public) ───────────────────────────
const getVoteStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await voteService.getVoteStats(req.params.ideaId as string, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vote stats fetched successfully",
    data: result,
  });
});

// ── Get My Votes (Member) ─────────────────────────────
const getMyVotes = catchAsync(async (req: Request, res: Response) => {
  const result = await voteService.getMyVotes(req.user!.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your votes fetched successfully",
    data: result,
  });
});

export const voteController = {
  castVote,
  removeVote,
  getVoteStats,
  getMyVotes,
};