// Routes for authentication endpoints.
import { Router } from "express";
import { authController } from "./auth.controller";
import validateRequest from "../../middlewares/validate.middleware";
import { authValidation } from "./auth.validation";
import authMiddleware from "../../middlewares/auth.middleware";

const router = Router();

router.post(
  "/register",
  validateRequest(authValidation.registerSchema),
  authController.register
);

router.post(
  "/login",
  validateRequest(authValidation.loginSchema),
  authController.login
);

router.get(
  "/me",
  authMiddleware,
  authController.getMe
);

export const authRoutes = router;