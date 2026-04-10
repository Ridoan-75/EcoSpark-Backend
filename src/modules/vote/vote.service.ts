import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { IdeaStatus, VoteType } from "../../../generated/prisma/client";

// ── Cast Vote (UP or DOWN) ────────────────────────────
const castVote = async (
  userId: string,
  payload: { ideaId: string; type: VoteType }
) => {
  const { ideaId, type } = payload;

  // Idea exists এবং approved কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    select: {
      id: true,
      status: true,
      authorId: true,
      isPaid: true,
    },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // শুধু approved idea তে vote দেওয়া যাবে
  if (idea.status !== IdeaStatus.APPROVED) {
    throw new AppError(400, "You can only vote on approved ideas");
  }

  // Paid idea তে vote দিতে হলে payment থাকতে হবে
  if (idea.isPaid) {
    const payment = await prisma.payment.findFirst({
      where: {
        ideaId,
        userId,
        status: "SUCCESS",
      },
    });

    // Author নিজে vote দিতে পারবে না
    if (!payment && idea.authorId !== userId) {
      throw new AppError(
        403,
        "Please purchase this idea before voting"
      );
    }
  }

  // Existing vote check করো
  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_ideaId: { userId, ideaId },
    },
  });

  let vote;
  let message;

  if (existingVote) {
    if (existingVote.type === type) {
      // Same vote type দিলে remove করো (toggle behavior)
      await prisma.vote.delete({
        where: {
          userId_ideaId: { userId, ideaId },
        },
      });

      message = `${type === "UP" ? "Upvote" : "Downvote"} removed successfully`;
      vote = null;
    } else {
      // Different vote type দিলে update করো
      vote = await prisma.vote.update({
        where: {
          userId_ideaId: { userId, ideaId },
        },
        data: { type },
        include: {
          idea: {
            select: {
              id: true,
              title: true,
              _count: {
                select: { votes: true },
              },
            },
          },
        },
      });

      message = `Vote changed to ${type === "UP" ? "upvote" : "downvote"} successfully`;
    }
  } else {
    // নতুন vote তৈরি করো
    vote = await prisma.vote.create({
      data: {
        userId,
        ideaId,
        type,
      },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            _count: {
              select: { votes: true },
            },
          },
        },
      },
    });

    message = `${type === "UP" ? "Upvoted" : "Downvoted"} successfully`;
  }

  // Updated vote counts নিয়ে আসো
  const voteCounts = await prisma.vote.groupBy({
    by: ["type"],
    where: { ideaId },
    _count: { type: true },
  });

  const upVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "UP")?._count.type ?? 0;
  const downVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "DOWN")?._count.type ?? 0;

  return {
    message,
    vote,
    voteStats: {
      upVotes,
      downVotes,
      totalVotes: upVotes + downVotes,
      score: upVotes - downVotes,
    },
  };
};

// ── Remove Vote ───────────────────────────────────────
const removeVote = async (userId: string, ideaId: string) => {
  // Idea exists কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    select: { id: true, status: true },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // Vote exists কিনা check করো
  const existingVote = await prisma.vote.findUnique({
    where: {
      userId_ideaId: { userId, ideaId },
    },
  });

  if (!existingVote) {
    throw new AppError(404, "You have not voted on this idea");
  }

  await prisma.vote.delete({
    where: {
      userId_ideaId: { userId, ideaId },
    },
  });

  // Updated vote counts নিয়ে আসো
  const voteCounts = await prisma.vote.groupBy({
    by: ["type"],
    where: { ideaId },
    _count: { type: true },
  });

  const upVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "UP")?._count.type ?? 0;
  const downVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "DOWN")?._count.type ?? 0;

  return {
    voteStats: {
      upVotes,
      downVotes,
      totalVotes: upVotes + downVotes,
      score: upVotes - downVotes,
    },
  };
};

// ── Get Vote Stats for an Idea (Public) ───────────────
const getVoteStats = async (ideaId: string, userId?: string) => {
  // Idea exists কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    select: { id: true },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  const voteCounts = await prisma.vote.groupBy({
    by: ["type"],
    where: { ideaId },
    _count: { type: true },
  });

  const upVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "UP")?._count.type ?? 0;
  const downVotes =
    voteCounts.find((v: { type: VoteType; _count: { type: number } }) => v.type === "DOWN")?._count.type ?? 0;

  // Current user এর vote status
  let userVote = null;
  if (userId) {
    const vote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: { userId, ideaId },
      },
      select: { type: true },
    });
    userVote = vote?.type ?? null;
  }

  return {
    ideaId,
    upVotes,
    downVotes,
    totalVotes: upVotes + downVotes,
    score: upVotes - downVotes,
    userVote,
  };
};

// ── Get My Votes (Member) ─────────────────────────────
const getMyVotes = async (userId: string) => {
  const votes = await prisma.vote.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          status: true,
          isDeleted: true,
          category: true,
          images: true,
        },
      },
    },
  });

  return votes;
};

export const voteService = {
  castVote,
  removeVote,
  getVoteStats,
  getMyVotes,
};