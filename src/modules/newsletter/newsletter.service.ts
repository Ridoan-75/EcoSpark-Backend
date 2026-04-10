import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import paginate from "../../utils/paginate";

// ── Subscribe ─────────────────────────────────────────
const subscribe = async (email: string) => {
  // Already subscribed কিনা check করো
  const existing = await prisma.newsletter.findUnique({
    where: { email },
  });

  if (existing) {
    // আগে unsubscribe করা ছিল — reactivate করো
    if (!existing.isActive) {
      const reactivated = await prisma.newsletter.update({
        where: { email },
        data: { isActive: true },
      });
      return {
        message: "You have been resubscribed successfully",
        newsletter: reactivated,
      };
    }

    throw new AppError(409, "This email is already subscribed");
  }

  const newsletter = await prisma.newsletter.create({
    data: { email },
  });

  return {
    message: "Subscribed successfully",
    newsletter,
  };
};

// ── Unsubscribe ───────────────────────────────────────
const unsubscribe = async (email: string) => {
  const existing = await prisma.newsletter.findUnique({
    where: { email },
  });

  if (!existing) {
    throw new AppError(404, "This email is not subscribed");
  }

  if (!existing.isActive) {
    throw new AppError(400, "This email is already unsubscribed");
  }

  const updated = await prisma.newsletter.update({
    where: { email },
    data: { isActive: false },
  });

  return updated;
};

// ── Get All Subscribers (Admin) ───────────────────────
const getAllSubscribers = async (query: Record<string, unknown>) => {
  const { page, limit, isActive } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const where: Record<string, unknown> = {};

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [subscribers, total] = await Promise.all([
    prisma.newsletter.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.newsletter.count({ where }),
  ]);

  // Stats
  const [activeCount, inactiveCount] = await Promise.all([
    prisma.newsletter.count({ where: { isActive: true } }),
    prisma.newsletter.count({ where: { isActive: false } }),
  ]);

  return {
    data: subscribers,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
    stats: {
      totalSubscribers: activeCount,
      totalUnsubscribed: inactiveCount,
    },
  };
};

// ── Delete Subscriber (Admin) ─────────────────────────
const deleteSubscriber = async (id: string) => {
  const subscriber = await prisma.newsletter.findUnique({
    where: { id },
  });

  if (!subscriber) {
    throw new AppError(404, "Subscriber not found");
  }

  await prisma.newsletter.delete({ where: { id } });

  return null;
};

export const newsletterService = {
  subscribe,
  unsubscribe,
  getAllSubscribers,
  deleteSubscriber,
};