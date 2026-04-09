import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import paginate from "../../utils/paginate";

// ── Create Category (Admin) ───────────────────────────
const createCategory = async (payload: { name: string }) => {
  // Duplicate check করো
  const existing = await prisma.category.findUnique({
    where: { name: payload.name },
  });

  if (existing) {
    throw new AppError(409, "Category with this name already exists");
  }

  const category = await prisma.category.create({
    data: { name: payload.name },
  });

  return category;
};

// ── Get All Categories (Public) ───────────────────────
const getAllCategories = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm } = query;

  const paginateOptions = paginate({
    page: page as string,
    limit: limit as string,
  });

  const where: Record<string, unknown> = {};

  if (searchTerm) {
    where.name = {
      contains: searchTerm as string,
      mode: "insensitive",
    };
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            // শুধু approved এবং deleted না এমন ideas count করবো
            ideas: {
              where: {
                status: "APPROVED",
                isDeleted: false,
              },
            },
          },
        },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data: categories,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Get Single Category (Public) ──────────────────────
const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          ideas: {
            where: {
              status: "APPROVED",
              isDeleted: false,
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  return category;
};

// ── Update Category (Admin) ───────────────────────────
const updateCategory = async (id: string, payload: { name: string }) => {
  // Category exists কিনা check করো
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  // নতুন নামে অন্য category আছে কিনা check করো
  const duplicate = await prisma.category.findFirst({
    where: {
      name: payload.name,
      id: { not: id },
    },
  });

  if (duplicate) {
    throw new AppError(409, "Category with this name already exists");
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { name: payload.name },
    include: {
      _count: {
        select: {
          ideas: {
            where: {
              status: "APPROVED",
              isDeleted: false,
            },
          },
        },
      },
    },
  });

  return updatedCategory;
};

// ── Delete Category (Admin) ───────────────────────────
const deleteCategory = async (id: string) => {
  // Category exists কিনা check করো
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { ideas: true },
      },
    },
  });

  if (!category) {
    throw new AppError(404, "Category not found");
  }

  // Category তে ideas থাকলে delete করা যাবে না
  if (category._count.ideas > 0) {
    throw new AppError(
      400,
      `Cannot delete category — it has ${category._count.ideas} idea(s) associated with it`
    );
  }

  await prisma.category.delete({ where: { id } });

  return null;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};