import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import AppError from "../errors/AppError";
import { jwtConfig } from "../config/jwt";
import prisma from "../lib/prisma";

// Request এ user type extend করো
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Header থেকে token নাও
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Unauthorized — no token provided");
    }

    const token = authHeader.split(" ")[1];

    // Token verify করো
    const decoded = jwt.verify(token, jwtConfig.secret) as JwtPayload;

    // User এখনো active কিনা check করো
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      throw new AppError(401, "Unauthorized — user not found");
    }

    if (!user.isActive) {
      throw new AppError(403, "Your account has been deactivated");
    }

    // req এ user attach করো
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default authMiddleware;