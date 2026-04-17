// Routes for category-related endpoints.
import { Router } from "express";
import { categoryController } from "./category.controller";
import authMiddleware from "../../middlewares/auth.middleware";
import roleMiddleware from "../../middlewares/role.middleware";
import validateRequest from "../../middlewares/validate.middleware";
import { categoryValidation } from "./category.validation";

const router = Router();

// Public routes
router.get(
  "/",
  categoryController.getAllCategories
);

router.get(
  "/:id",
  categoryController.getCategoryById
);

// ── Admin routes ──────────────────────────────────────
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validateRequest(categoryValidation.createCategorySchema),
  categoryController.createCategory
);

router.patch(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  validateRequest(categoryValidation.updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  categoryController.deleteCategory
);

export const categoryRoutes = router;