import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { categoryService } from "./category.service";
import httpStatus from "http-status";

// ── Create Category (Admin) ───────────────────────────
const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.createCategory(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Category created successfully",
    data: result,
  });
});

// ── Get All Categories (Public) ───────────────────────
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await categoryService.getAllCategories(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Categories fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

// ── Get Single Category (Public) ──────────────────────
const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await categoryService.getCategoryById(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category fetched successfully",
    data: result,
  });
});

// ── Update Category (Admin) ───────────────────────────
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = await categoryService.updateCategory(categoryId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category updated successfully",
    data: result,
  });
});

// ── Delete Category (Admin) ───────────────────────────
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await categoryService.deleteCategory(categoryId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category deleted successfully",
    data: null,
  });
});

export const categoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};