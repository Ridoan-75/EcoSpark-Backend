import { z } from "zod";

const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters")
      .optional(),

    profileImage: z
      .string()
      .url("Invalid image URL")
      .optional(),
  }),
});

const updateUserStatusSchema = z.object({
  body: z.object({
    isActive: z
      .boolean()
      .refine((value) => value === true || value === false, {
        message: "isActive is required",
      }),
  }),
});

const updateUserRoleSchema = z.object({
  body: z.object({
    role: z
      .string()
      .nonempty("Role is required")
      .refine((value) => value === "MEMBER" || value === "ADMIN", {
        message: "Role must be MEMBER or ADMIN",
      }),
  }),
});

export const userValidation = {
  updateProfileSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
};