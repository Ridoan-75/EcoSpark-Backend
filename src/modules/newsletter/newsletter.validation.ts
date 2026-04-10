import { z } from "zod";

const subscribeSchema = z.object({
  body: z.object({
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address")
      .trim()
      .toLowerCase(),
  }),
});

const unsubscribeSchema = z.object({
  body: z.object({
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address")
      .trim()
      .toLowerCase(),
  }),
});

export const newsletterValidation = {
  subscribeSchema,
  unsubscribeSchema,
};