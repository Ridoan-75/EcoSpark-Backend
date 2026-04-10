import { Router } from "express";
import { userController } from "./user.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { userValidation } from "./user.validation";
import { uploadSingle } from "../../utils/imageUpload";

const router = Router();

// ── Admin routes ──────────────────────────────────────
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getAllUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getUserById
);

router.patch(
  "/:id/status",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validateRequest(userValidation.updateUserStatusSchema),
  userController.updateUserStatus
);

router.patch(
  "/:id/role",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validateRequest(userValidation.updateUserRoleSchema),
  userController.updateUserRole
);

// ── Member routes ─────────────────────────────────────
router.get(
  "/profile/me",
  authMiddleware,
  userController.getMyProfile
);

router.patch(
  "/profile/me",
  authMiddleware,
  uploadSingle,                                 // profile image upload
  validateRequest(userValidation.updateProfileSchema),
  userController.updateMyProfile
);

router.delete(
  "/profile/me",
  authMiddleware,
  userController.deleteMyAccount
);

export const userRoutes = router;