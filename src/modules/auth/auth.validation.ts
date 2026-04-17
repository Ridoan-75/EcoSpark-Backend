// Validation schemas for authentication requests using Zod.
import { z } from "zod";

const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .nonempty("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),

    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address"),

    password: z
      .string()
      .nonempty("Password is required")
      .min(8, "Password must be at least 8 characters"),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address"),

    password: z.string().nonempty("Password is required"),
  }),
});

export const authValidation = {
  registerSchema,
  loginSchema,
};