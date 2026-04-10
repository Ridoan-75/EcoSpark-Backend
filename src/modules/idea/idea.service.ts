import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import paginate from "../../utils/paginate";
import type { Prisma } from "../../../generated/prisma/client";
import { IdeaStatus } from "../../../generated/prisma/client";

// ── Create Idea (Member) ──────────────────────────────
const createIdea = async (
  userId: string,
  payload: {
    title: string;
    problemStatement: string;
    proposedSolution: string;
    description: string;
    categoryId: string;
    isPaid: boolean;
    price?: number | null;
    images: string[];
  }
) => {
  // Category exists কিনা check করো
  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  // isPaid false হলে price null করো
  const ideaData = {
    ...payload,
    price: payload.isPaid ? payload.price : null,
    authorId: userId,
    status: IdeaStatus.DRAFT,
  };

  const idea = await prisma.idea.create({
    data: ideaData,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  });

  return idea;
};

// ── Get All Approved Ideas (Public) ───────────────────
const getAllIdeas = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm, categoryId, isPaid, sortBy } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  // Base where — শুধু approved এবং deleted না এমন ideas
  const where: Prisma.IdeaWhereInput = {
    status: IdeaStatus.APPROVED,
    isDeleted: false,
  };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm as string, mode: "insensitive" } },
      { description: { contains: searchTerm as string, mode: "insensitive" } },
      {
        problemStatement: {
          contains: searchTerm as string,
          mode: "insensitive",
        },
      },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId as string;
  }

  if (isPaid !== undefined) {
    where.isPaid = isPaid === "true";
  }

  // Sort options
  let orderBy: Prisma.IdeaOrderByWithRelationInput = {
    createdAt: "desc",
  };

  if (sortBy === "top_voted") {
    orderBy = { votes: { _count: "desc" } };
  } else if (sortBy === "most_commented") {
    orderBy = { comments: { _count: "desc" } };
  } else if (sortBy === "most_viewed") {
    orderBy = { viewCount: "desc" };
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        category: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.idea.count({ where }),
  ]);

  return {
    data: ideas,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Get Single Idea (Public — paid check আলাদা middleware এ) ──
const getIdeaById = async (id: string, userId?: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id, isDeleted: false },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      category: true,
      votes: {
        select: {
          id: true,
          type: true,
          userId: true,
        },
      },
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // Approved না হলে শুধু author বা admin দেখতে পারবে
  if (idea.status !== IdeaStatus.APPROVED) {
    if (!userId || (userId !== idea.authorId)) {
      throw new AppError(403, "This idea is not publicly available");
    }
  }

  // viewCount বাড়াও — শুধু approved idea তে
  if (idea.status === IdeaStatus.APPROVED) {
    await prisma.idea.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  // Current user এর vote status
  const userVote = userId
    ? idea.votes.find((v) => v.userId === userId)
    : null;

  // Paid idea তে price hide করা দরকার না — payment check middleware করবে
  return {
    ...idea,
    userVote: userVote ? userVote.type : null,
  };
};

// ── Get My Ideas (Member) ─────────────────────────────
const getMyIdeas = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const { page, limit, status } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const where: Prisma.IdeaWhereInput = {
    authorId: userId,
    isDeleted: false,
  };

  if (status) {
    where.status = status as IdeaStatus;
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.idea.count({ where }),
  ]);

  return {
    data: ideas,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Get All Ideas (Admin) ─────────────────────────────
const getAllIdeasAdmin = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm, status, categoryId } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const where: Prisma.IdeaWhereInput = {
    isDeleted: false,
  };

  if (searchTerm) {
    where.OR = [
      { title: { contains: searchTerm as string, mode: "insensitive" } },
      {
        author: {
          name: { contains: searchTerm as string, mode: "insensitive" },
        },
      },
    ];
  }

  if (status) {
    where.status = status as IdeaStatus;
  }

  if (categoryId) {
    where.categoryId = categoryId as string;
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        category: true,
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.idea.count({ where }),
  ]);

  return {
    data: ideas,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Update Idea (Member — only if DRAFT or REJECTED) ──
const updateIdea = async (
  ideaId: string,
  userId: string,
  payload: Partial<{
    title: string;
    problemStatement: string;
    proposedSolution: string;
    description: string;
    categoryId: string;
    isPaid: boolean;
    price: number | null;
    images: string[];
  }>
) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // Owner check করো
  if (idea.authorId !== userId) {
    throw new AppError(403, "You are not authorized to update this idea");
  }

  // শুধু DRAFT বা REJECTED idea edit করা যাবে
  if (
    idea.status !== IdeaStatus.DRAFT &&
    idea.status !== IdeaStatus.REJECTED
  ) {
    throw new AppError(
      400,
      "Only draft or rejected ideas can be edited"
    );
  }

  // Category check করো
  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId },
    });
    if (!category) {
      throw new AppError(404, "Category not found");
    }
  }

  // isPaid false হলে price null করো
  if (payload.isPaid === false) {
    payload.price = null;
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: ideaId },
    data: {
      ...payload,
      // Rejected idea edit করলে status DRAFT এ ফিরে যাবে
      status: idea.status === IdeaStatus.REJECTED
        ? IdeaStatus.DRAFT
        : idea.status,
      rejectionFeedback: idea.status === IdeaStatus.REJECTED
        ? null
        : idea.rejectionFeedback,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      category: true,
    },
  });

  return updatedIdea;
};

// ── Submit Idea for Review (Member) ───────────────────
const submitIdea = async (ideaId: string, userId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // Owner check করো
  if (idea.authorId !== userId) {
    throw new AppError(403, "You are not authorized to submit this idea");
  }

  // শুধু DRAFT idea submit করা যাবে
  if (idea.status !== IdeaStatus.DRAFT) {
    throw new AppError(
      400,
      "Only draft ideas can be submitted for review"
    );
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: ideaId },
    data: { status: IdeaStatus.UNDER_REVIEW },
    include: {
      category: true,
    },
  });

  return updatedIdea;
};

// ── Approve Idea (Admin) ──────────────────────────────
const approveIdea = async (ideaId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // শুধু UNDER_REVIEW idea approve করা যাবে
  if (idea.status !== IdeaStatus.UNDER_REVIEW) {
    throw new AppError(400, "Only ideas under review can be approved");
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: ideaId },
    data: {
      status: IdeaStatus.APPROVED,
      rejectionFeedback: null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      category: true,
    },
  });

  return updatedIdea;
};

// ── Reject Idea (Admin) ───────────────────────────────
const rejectIdea = async (ideaId: string, rejectionFeedback: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // শুধু UNDER_REVIEW idea reject করা যাবে
  if (idea.status !== IdeaStatus.UNDER_REVIEW) {
    throw new AppError(400, "Only ideas under review can be rejected");
  }

  const updatedIdea = await prisma.idea.update({
    where: { id: ideaId },
    data: {
      status: IdeaStatus.REJECTED,
      rejectionFeedback,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      category: true,
    },
  });

  return updatedIdea;
};

// ── Delete Idea (Member — soft delete, only DRAFT/REJECTED) ──
const deleteIdea = async (ideaId: string, userId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // Owner check করো
  if (idea.authorId !== userId) {
    throw new AppError(403, "You are not authorized to delete this idea");
  }

  // শুধু DRAFT বা REJECTED idea delete করা যাবে
  if (
    idea.status !== IdeaStatus.DRAFT &&
    idea.status !== IdeaStatus.REJECTED
  ) {
    throw new AppError(
      400,
      "Only draft or rejected ideas can be deleted"
    );
  }

  // Soft delete
  await prisma.idea.update({
    where: { id: ideaId },
    data: { isDeleted: true },
  });

  return null;
};

// ── Delete Idea Admin (Admin — soft delete any idea) ──
const deleteIdeaAdmin = async (ideaId: string) => {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  await prisma.idea.update({
    where: { id: ideaId },
    data: { isDeleted: true },
  });

  return null;
};

// ── Get Top Voted Ideas (Public — Homepage) ───────────
const getTopVotedIdeas = async (limit: number = 3) => {
  const ideas = await prisma.idea.findMany({
    where: {
      status: IdeaStatus.APPROVED,
      isDeleted: false,
      isPaid: false,
    },
    orderBy: {
      votes: { _count: "desc" },
    },
    take: limit,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      category: true,
      _count: {
        select: {
          votes: true,
          comments: true,
        },
      },
    },
  });

  return ideas;
};

export const ideaService = {
  createIdea,
  getAllIdeas,
  getIdeaById,
  getMyIdeas,
  getAllIdeasAdmin,
  updateIdea,
  submitIdea,
  approveIdea,
  rejectIdea,
  deleteIdea,
  deleteIdeaAdmin,
  getTopVotedIdeas,
};