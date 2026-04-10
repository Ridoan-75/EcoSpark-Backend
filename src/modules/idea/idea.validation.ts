import { z } from "zod";

const createIdeaSchema = z.object({
  body: z.object({
    title: z
      .string()
      .nonempty("Title is required")
      .min(5, "Title must be at least 5 characters")
      .max(150, "Title must be at most 150 characters")
      .trim(),

    problemStatement: z
      .string()
      .nonempty("Problem statement is required")
      .min(20, "Problem statement must be at least 20 characters")
      .trim(),

    proposedSolution: z
      .string()
      .nonempty("Proposed solution is required")
      .min(20, "Proposed solution must be at least 20 characters")
      .trim(),

    description: z
      .string()
      .nonempty("Description is required")
      .min(50, "Description must be at least 50 characters")
      .trim(),

    categoryId: z
      .string()
      .nonempty("Category is required")
      .uuid("Invalid category ID"),

    isPaid: z.boolean().default(false),

    price: z
      .number()
      .min(1, "Price must be at least 1")
      .optional()
      .nullable(),

    images: z
      .array(z.string().url("Invalid image URL"))
      .min(1, "At least one image is required")
      .max(5, "Maximum 5 images allowed"),
  }).refine(
    (data) => {
      // isPaid true হলে price অবশ্যই দিতে হবে
      if (data.isPaid && (!data.price || data.price <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Price is required and must be greater than 0 for paid ideas",
      path: ["price"],
    }
  ),
});

const updateIdeaSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(150, "Title must be at most 150 characters")
      .trim()
      .optional(),

    problemStatement: z
      .string()
      .min(20, "Problem statement must be at least 20 characters")
      .trim()
      .optional(),

    proposedSolution: z
      .string()
      .min(20, "Proposed solution must be at least 20 characters")
      .trim()
      .optional(),

    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .trim()
      .optional(),

    categoryId: z
      .string()
      .uuid("Invalid category ID")
      .optional(),

    isPaid: z.boolean().optional(),

    price: z
      .number()
      .min(1, "Price must be at least 1")
      .optional()
      .nullable(),

    images: z
      .array(z.string().url("Invalid image URL"))
      .min(1, "At least one image is required")
      .max(5, "Maximum 5 images allowed")
      .optional(),
  }).refine(
    (data) => {
      if (data.isPaid && (!data.price || data.price <= 0)) {
        return false;
      }
      return true;
    },
    {
      message: "Price is required and must be greater than 0 for paid ideas",
      path: ["price"],
    }
  ),
});

const rejectIdeaSchema = z.object({
  body: z.object({
    rejectionFeedback: z
      .string()
      .nonempty("Rejection feedback is required")
      .min(10, "Feedback must be at least 10 characters")
      .trim(),
  }),
});

const submitIdeaSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid idea ID"),
  }),
});

export const ideaValidation = {
  createIdeaSchema,
  updateIdeaSchema,
  rejectIdeaSchema,
  submitIdeaSchema,
};