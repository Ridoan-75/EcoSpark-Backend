// Validation schemas for category requests using Zod.
import { z } from "zod";

const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .nonempty("Category name is required")
      .min(2, "Category name must be at least 2 characters")
      .max(50, "Category name must be at most 50 characters")
      .trim(),
  }),
});

const updateCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .nonempty("Category name is required")
      .min(2, "Category name must be at least 2 characters")
      .max(50, "Category name must be at most 50 characters")
      .trim(),
  }),
});

export const categoryValidation = {
  createCategorySchema,
  updateCategorySchema,
};