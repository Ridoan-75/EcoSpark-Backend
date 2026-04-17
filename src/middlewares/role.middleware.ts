// Role-based access control middleware to restrict access based on user roles.
import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";

const roleMiddleware = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Unauthorized — please login first");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        403,
        "Forbidden — you do not have permission to access this resource"
      );
    }

    next();
  };
};

export default roleMiddleware;