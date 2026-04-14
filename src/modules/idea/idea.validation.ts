import { z } from "zod";

const createIdeaSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(5, "Title must be at least 5 characters")
      .max(150, "Title must be at most 150 characters")
      .trim(),

    problemStatement: z
      .string()
      .min(20, "Problem statement must be at least 20 characters")
      .trim(),

    proposedSolution: z
      .string()
      .min(20, "Proposed solution must be at least 20 characters")
      .trim(),

    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .trim(),

    categoryId: z
      .string()
      .uuid("Invalid category ID"),

    // ── FormData থেকে আসলে string হয় — coerce করতে হবে ──
    isPaid: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") return val === "true";
        return val;
      })
      .default(false),

    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      })
      .optional()
      .nullable(),

    // ── images array — FormData থেকে string বা array আসতে পারে ──
    images: z
      .union([
        z.array(z.string()),
        z.string(),
      ])
      .transform((val) => {
        if (typeof val === "string") return [val];
        return val;
      })
      .optional()
      .default([]),
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

    isPaid: z
      .union([z.boolean(), z.string()])
      .transform((val) => {
        if (typeof val === "string") return val === "true";
        return val;
      })
      .optional(),

    price: z
      .union([z.number(), z.string(), z.null(), z.undefined()])
      .transform((val) => {
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return isNaN(num) ? null : num;
      })
      .optional()
      .nullable(),

    images: z
      .union([
        z.array(z.string()),
        z.string(),
      ])
      .transform((val) => {
        if (typeof val === "string") return [val];
        return val;
      })
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