import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../lib/prisma";
import AppError from "../../errors/AppError";
import { jwtConfig } from "../../config/jwt";
import { Role } from "@prisma/client";

// ── Register ─────────────────────────────────────────
const register = async (payload: {
  name: string;
  email: string;
  password: string;
}) => {
  // Email already exists কিনা check করো
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (existingUser) {
    throw new AppError(409, "User already exists with this email");
  }

  // Password hash করো
  const hashedPassword = await bcrypt.hash(payload.password, 12);

  // User তৈরি করো
  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isActive: true,
      createdAt: true,
    },
  });

  // Token তৈরি করো
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn as string }
  );

  return { user, token };
};

// ── Login ─────────────────────────────────────────────
const login = async (payload: { email: string; password: string }) => {
  // User আছে কিনা check করো
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(401, "Invalid email or password");
  }

  // Account active কিনা check করো
  if (!user.isActive) {
    throw new AppError(403, "Your account has been deactivated. Contact support.");
  }

  // Password match করো
  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new AppError(401, "Invalid email or password");
  }

  // Token তৈরি করো
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn as string }
  );

  const { password: _, ...userWithoutPassword } = user;

  return { user: userWithoutPassword, token };
};

// ── Get Me ────────────────────────────────────────────
const getMe = async (userId: string) => {
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
      _count: {
        select: {
          ideas: true,
          votes: true,
          comments: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return user;
};

export const authService = {
  register,
  login,
  getMe,
};