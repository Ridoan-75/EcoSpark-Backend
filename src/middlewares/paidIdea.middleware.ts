import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import AppError from "../errors/AppError";
import { IdeaStatus } from "../../generated/prisma/client";

const paidIdeaMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ideaId = req.params.id as string;

    // Idea খুঁজে বের করো
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId, isDeleted: false },
      select: {
        id: true,
        isPaid: true,
        price: true,
        status: true,
        authorId: true,
      },
    });

    if (!idea) {
      throw new AppError(404, "Idea not found");
    }

    // Free idea হলে সরাসরি next() — কোনো check দরকার নেই
    if (!idea.isPaid) {
      return next();
    }

    // Approved না হলে paid check skip করো
    // (getIdeaById service নিজেই author/admin check করবে)
    if (idea.status !== IdeaStatus.APPROVED) {
      return next();
    }

    // Paid idea — user login আছে কিনা check করো
    if (!req.user) {
      throw new AppError(
        401,
        "Please login to access this paid idea"
      );
    }

    // Author নিজে সবসময় দেখতে পারবে
    if (req.user.id === idea.authorId) {
      return next();
    }

    // Admin সবসময় দেখতে পারবে
    if (req.user.role === "ADMIN") {
      return next();
    }

    // Payment করা আছে কিনা check করো
    const payment = await prisma.payment.findFirst({
      where: {
        ideaId,
        userId: req.user.id,
        status: "SUCCESS",
      },
    });

    if (!payment) {
      // Paid idea কিন্তু payment নেই — flag set করো
      // Frontend এটা দেখে error handle করবে
      req.requiresPaidAccess = true;
    }

    // সবসময় next() call করো — controller ই access level decide করবে
    next();
  } catch (err) {
    next(err);
  }
};

export default paidIdeaMiddleware;