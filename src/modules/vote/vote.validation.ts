import { z } from "zod";

const castVoteSchema = z.object({
  body: z.object({
    ideaId: z
      .string()
      .nonempty("Idea ID is required")
      .uuid("Invalid idea ID"),

    type: z.enum(["UP", "DOWN"]),
  }),
});

const removeVoteSchema = z.object({
  params: z.object({
    ideaId: z
      .string()
      .nonempty("Idea ID is required")
      .uuid("Invalid idea ID"),
  }),
});

export const voteValidation = {
  castVoteSchema,
  removeVoteSchema,
};