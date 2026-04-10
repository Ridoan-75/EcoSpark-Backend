import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { IdeaStatus } from "../../../generated/prisma/client";
import paginate from "../../utils/paginate";

// ── Create Comment or Reply ───────────────────────────
const createComment = async (
  userId: string,
  payload: {
    body: string;
    ideaId: string;
    parentId?: string | null;
  }
) => {
  const { body, ideaId, parentId } = payload;

  // Idea exists এবং approved কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    select: { id: true, status: true, isPaid: true },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  if (idea.status !== IdeaStatus.APPROVED) {
    throw new AppError(400, "You can only comment on approved ideas");
  }

  // Paid idea তে comment করতে payment থাকতে হবে
  if (idea.isPaid) {
    const payment = await prisma.payment.findFirst({
      where: {
        ideaId,
        userId,
        status: "SUCCESS",
      },
    });

    if (!payment) {
      throw new AppError(
        403,
        "Please purchase this idea before commenting"
      );
    }
  }

  // Reply হলে parent comment exists কিনা check করো
  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId, isDeleted: false },
      select: {
        id: true,
        ideaId: true,
        parentId: true,
      },
    });

    if (!parentComment) {
      throw new AppError(404, "Parent comment not found");
    }

    // Parent comment একই idea তে কিনা check করো
    if (parentComment.ideaId !== ideaId) {
      throw new AppError(
        400,
        "Parent comment does not belong to this idea"
      );
    }

    // শুধু top-level comment এ reply দেওয়া যাবে
    // nested reply এর reply allow করবো না (2 level max)
    if (parentComment.parentId) {
      throw new AppError(
        400,
        "Replies to replies are not allowed — maximum 2 levels of nesting"
      );
    }
  }

  const comment = await prisma.comment.create({
    data: {
      body,
      ideaId,
      authorId: userId,
      parentId: parentId || null,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  return comment;
};

// ── Get Comments for an Idea (Public) ─────────────────
// Nested structure — top level comments + replies
const getCommentsByIdeaId = async (
  ideaId: string,
  query: Record<string, unknown>
) => {
  const { page, limit } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: (limit as string) || "20",
  });

  // Idea exists কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    select: { id: true },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  // শুধু top-level comments নিয়ে আসো (parentId null)
  // replies include করো nested ভাবে
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        ideaId,
        parentId: null,       // শুধু top level
        isDeleted: false,
      },
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        // Replies include করো
        replies: {
          where: { isDeleted: false },
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            _count: {
              select: { replies: true },
            },
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    prisma.comment.count({
      where: {
        ideaId,
        parentId: null,
        isDeleted: false,
      },
    }),
  ]);

  return {
    data: comments,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Update Comment (Owner only) ────────────────────────
const updateComment = async (
  commentId: string,
  userId: string,
  body: string
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId, isDeleted: false },
  });

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  // Owner check করো
  if (comment.authorId !== userId) {
    throw new AppError(403, "You are not authorized to update this comment");
  }

  const updatedComment = await prisma.comment.update({
    where: { id: commentId },
    data: { body },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          profileImage: true,
        },
      },
      _count: {
        select: { replies: true },
      },
    },
  });

  return updatedComment;
};

// ── Delete Comment (Owner or Admin — soft delete) ──────
const deleteComment = async (
  commentId: string,
  userId: string,
  userRole: string
) => {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId, isDeleted: false },
    select: {
      id: true,
      authorId: true,
      parentId: true,
      _count: {
        select: { replies: true },
      },
    },
  });

  if (!comment) {
    throw new AppError(404, "Comment not found");
  }

  // Owner অথবা Admin delete করতে পারবে
  if (comment.authorId !== userId && userRole !== "ADMIN") {
    throw new AppError(
      403,
      "You are not authorized to delete this comment"
    );
  }

  // Soft delete — replies গুলোও soft delete করো
  if (comment._count.replies > 0) {
    await prisma.comment.updateMany({
      where: { parentId: commentId },
      data: { isDeleted: true },
    });
  }

  await prisma.comment.update({
    where: { id: commentId },
    data: { isDeleted: true },
  });

  return null;
};

// ── Get All Comments Admin (Admin) ─────────────────────
const getAllCommentsAdmin = async (query: Record<string, unknown>) => {
  const { page, limit, ideaId, userId } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const where: Record<string, unknown> = {
    isDeleted: false,
  };

  if (ideaId) {
    where.ideaId = ideaId as string;
  }

  if (userId) {
    where.authorId = userId as string;
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
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
        idea: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return {
    data: comments,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Get My Comments (Member) ──────────────────────────
const getMyComments = async (
  userId: string,
  query: Record<string, unknown>
) => {
  const { page, limit } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: {
        authorId: userId,
        isDeleted: false,
      },
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
        _count: {
          select: { replies: true },
        },
      },
    }),
    prisma.comment.count({
      where: {
        authorId: userId,
        isDeleted: false,
      },
    }),
  ]);

  return {
    data: comments,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

export const commentService = {
  createComment,
  getCommentsByIdeaId,
  updateComment,
  deleteComment,
  getAllCommentsAdmin,
  getMyComments,
};