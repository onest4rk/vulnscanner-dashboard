import { cookies } from "next/headers";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import type { StringValue } from "ms";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_EXPIRES_IN: StringValue = "8h";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export function signToken(user: SessionUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function requireRole(
  user: SessionUser | null,
  roles: Role[]
): SessionUser {
  if (!user) throw new Error("Unauthorized");
  if (!roles.includes(user.role)) throw new Error("Forbidden");
  return user;
}

export function canManageTargets(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "ANALYST";
}

export function canTriggerScans(user: SessionUser | null): boolean {
  if (!user) return false;
  return user.role === "ADMIN" || user.role === "ANALYST";
}

export function canViewReports(user: SessionUser | null): boolean {
  return user !== null;
}
