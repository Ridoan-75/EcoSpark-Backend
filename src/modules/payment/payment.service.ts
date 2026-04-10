import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import stripe from "../../config/stripe";
import { IdeaStatus, PaymentStatus } from "../../../generated/prisma/client";

// ── Initiate Payment (Stripe Checkout Session) ────────
const initiatePayment = async (userId: string, ideaId: string) => {
  // Idea exists এবং approved কিনা check করো
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId, isDeleted: false },
    include: {
      author: {
        select: { id: true, name: true },
      },
      category: {
        select: { name: true },
      },
    },
  });

  if (!idea) {
    throw new AppError(404, "Idea not found");
  }

  if (idea.status !== IdeaStatus.APPROVED) {
    throw new AppError(400, "This idea is not available for purchase");
  }

  // Free idea কিনা check করো
  if (!idea.isPaid || !idea.price) {
    throw new AppError(400, "This idea is free — no payment required");
  }

  // Author নিজের idea কিনতে পারবে না
  if (idea.authorId === userId) {
    throw new AppError(400, "You cannot purchase your own idea");
  }

  // ইতিমধ্যে payment করা আছে কিনা check করো
  const existingPayment = await prisma.payment.findFirst({
    where: {
      userId,
      ideaId,
      status: PaymentStatus.SUCCESS,
    },
  });

  if (existingPayment) {
    throw new AppError(409, "You have already purchased this idea");
  }

  // Pending payment থাকলে delete করো — নতুন session তৈরি হবে
  await prisma.payment.deleteMany({
    where: {
      userId,
      ideaId,
      status: PaymentStatus.PENDING,
    },
  });

  // Stripe Checkout Session তৈরি করো
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: idea.title,
            description: `Category: ${idea.category.name} | Author: ${idea.author.name}`,
          },
          // Stripe amount in cents
          unit_amount: Math.round(idea.price * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      ideaId,
    },
    success_url: `${process.env.STRIPE_SUCCESS_URL}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: process.env.STRIPE_CANCEL_URL as string,
  });

  // Payment record PENDING হিসেবে save করো
  const payment = await prisma.payment.create({
    data: {
      userId,
      ideaId,
      amount: idea.price,
      status: PaymentStatus.PENDING,
      gateway: "STRIPE",
      stripeSessionId: session.id,
    },
  });

  return {
    payment,
    checkoutUrl: session.url,
    sessionId: session.id,
  };
};

// ── Stripe Webhook Handler ────────────────────────────
const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string
) => {
  let event: any;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    throw new AppError(400, `Webhook signature verification failed: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;

      // Payment SUCCESS করো
      await prisma.payment.updateMany({
        where: { stripeSessionId: session.id },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionId: session.payment_intent as string,
        },
      });

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;

      // Payment FAILED করো
      await prisma.payment.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: PaymentStatus.FAILED },
      });

      break;
    }

    case "charge.refunded": {
      const charge = event.data.object;

      // Payment REFUNDED করো
      await prisma.payment.updateMany({
        where: { transactionId: charge.payment_intent as string },
        data: { status: PaymentStatus.REFUNDED },
      });

      break;
    }

    default:
      // Unhandled event type — ignore
      break;
  }

  return { received: true };
};

// ── Verify Payment Success ────────────────────────────
// Frontend success page এ call করবে session verify করতে
const verifyPayment = async (sessionId: string, userId: string) => {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (!session) {
    throw new AppError(404, "Payment session not found");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      stripeSessionId: sessionId,
      userId,
    },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          category: true,
          images: true,
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(404, "Payment record not found");
  }

  return {
    payment,
    sessionStatus: session.payment_status,
  };
};

// ── Get My Payments (Member) ──────────────────────────
const getMyPayments = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      idea: {
        select: {
          id: true,
          title: true,
          isDeleted: true,
          category: {
            select: { name: true },
          },
          images: true,
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      },
    },
  });

  return payments;
};

// ── Get All Payments (Admin) ──────────────────────────
const getAllPayments = async (query: Record<string, unknown>) => {
  const { page, limit, status, userId, ideaId } = query;

  const paginateOptions = {
    skip: ((Number(page) || 1) - 1) * (Number(limit) || 10),
    take: Number(limit) || 10,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
  };

  const where: Record<string, unknown> = {};

  if (status) {
    where.status = status as PaymentStatus;
  }

  if (userId) {
    where.userId = userId as string;
  }

  if (ideaId) {
    where.ideaId = ideaId as string;
  }

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
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
            category: {
              select: { name: true },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  // Total revenue calculate করো
  const revenueData = await prisma.payment.aggregate({
    where: { status: PaymentStatus.SUCCESS },
    _sum: { amount: true },
    _count: { id: true },
  });

  return {
    data: payments,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
    stats: {
      totalRevenue: revenueData._sum.amount ?? 0,
      totalSuccessfulPayments: revenueData._count.id,
    },
  };
};

// ── Check if User has Access to Paid Idea ─────────────
const checkAccess = async (userId: string, ideaId: string) => {
  const payment = await prisma.payment.findFirst({
    where: {
      userId,
      ideaId,
      status: PaymentStatus.SUCCESS,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return {
    hasAccess: !!payment,
    payment: payment || null,
  };
};

export const paymentService = {
  initiatePayment,
  handleStripeWebhook,
  verifyPayment,
  getMyPayments,
  getAllPayments,
  checkAccess,
};