import { z } from "zod";

const createCommentSchema = z.object({
  body: z.object({
    body: z
      .string()
      .nonempty("Comment body is required")
      .min(1, "Comment cannot be empty")
      .max(1000, "Comment must be at most 1000 characters")
      .trim(),

    ideaId: z
      .string()
      .nonempty("Idea ID is required")
      .uuid("Invalid idea ID"),

    parentId: z
      .string()
      .uuid("Invalid parent comment ID")
      .optional()
      .nullable(),
  }),
});

const updateCommentSchema = z.object({
  body: z.object({
    body: z
      .string()
      .nonempty("Comment body is required")
      .min(1, "Comment cannot be empty")
      .max(1000, "Comment must be at most 1000 characters")
      .trim(),
  }),
});

export const commentValidation = {
  createCommentSchema,
  updateCommentSchema,
};