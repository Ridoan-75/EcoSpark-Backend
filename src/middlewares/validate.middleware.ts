// Validation middleware using Zod to validate request data.
import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import AppError from "../errors/AppError";

const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const errorMessages = err.issues
          .map((e: { message: string }) => e.message)
          .join(", ");
        return next(new AppError(400, errorMessages));
      }
      next(err);
    }
  };
};

export default validateRequest;