import {prisma} from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { Role } from "../../../generated/prisma/enums";
import pick from "../../utils/pick";
import paginate from "../../utils/paginate";

// ── Get All Users (Admin) ─────────────────────────────
const getAllUsers = async (query: Record<string, unknown>) => {
  const { page, limit, searchTerm, role, isActive } = query;

  const paginateOptions = paginate({ page: page as string, limit: limit as string });

  // Filter build করো
  const where: Record<string, unknown> = {};

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm as string, mode: "insensitive" } },
      { email: { contains: searchTerm as string, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role as Role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: paginateOptions.skip,
      take: paginateOptions.take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        profileImage: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            ideas: true,
            votes: true,
            comments: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    meta: {
      page: paginateOptions.page,
      limit: paginateOptions.limit,
      total,
      totalPage: Math.ceil(total / paginateOptions.limit),
    },
  };
};

// ── Get Single User (Admin) ───────────────────────────
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ideas: true,
          votes: true,
          comments: true,
          payments: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

// ── Update User Status (Admin) ────────────────────────
const updateUserStatus = async (id: string, isActive: boolean) => {
  // User exists কিনা check করো
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Admin কে deactivate করা যাবে না
  if (user.role === Role.ADMIN && !isActive) {
    throw new AppError(403, "Admin account cannot be deactivated");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// ── Update User Role (Admin) ──────────────────────────
const updateUserRole = async (id: string, role: Role) => {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// ── Get My Profile (Member) ───────────────────────────
const getMyProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          ideas: true,
          votes: true,
          comments: true,
          payments: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

// ── Update My Profile (Member) ────────────────────────
const updateMyProfile = async (
  userId: string,
  payload: { name?: string; profileImage?: string }
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(payload.name && { name: payload.name }),
      ...(payload.profileImage && { profileImage: payload.profileImage }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

// ── Delete My Account (Member) ────────────────────────
const deleteMyAccount = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  // Admin নিজের account delete করতে পারবে না
  if (user.role === Role.ADMIN) {
    throw new AppError(403, "Admin account cannot be deleted");
  }

  // Soft delete — isActive false করে দাও
  await prisma.user.update({
    where: { id: userId },
    data: { isActive: false },
  });

  return null;
};

export const userService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
};