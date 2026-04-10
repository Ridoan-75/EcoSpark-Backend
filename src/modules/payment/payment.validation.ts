import { z } from "zod";

const initiatePaymentSchema = z.object({
  body: z.object({
    ideaId: z
      .string()
      .nonempty("Idea ID is required")
      .uuid("Invalid idea ID"),
  }),
});

export const paymentValidation = {
  initiatePaymentSchema,
};