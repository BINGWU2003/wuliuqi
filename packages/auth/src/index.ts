import type { AdminUser } from "@wuliuqi/types";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@wuliuqi/db";
import { SESSION_MAX_AGE_SECONDS } from "./constants";

export { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "./constants";

type SessionPayload = {
  id: number;
  email: string;
  name: string;
};

export class AuthError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 401,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

function getSecret() {
  const secret =
    process.env.JWT_SECRET ??
    process.env.ADMIN_SESSION_SECRET ??
    (process.env.NODE_ENV === "production" ? undefined : "wuliuqi-local-admin-secret");

  if (!secret) {
    throw new AuthError("AUTH_CONFIG_ERROR", "缺少 JWT_SECRET", 500);
  }

  return new TextEncoder().encode(secret);
}

function serializeUser(user: {
  id: number;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function signSessionToken(user: AdminUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySessionToken(
  token?: string,
): Promise<SessionPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.id);
    const email = typeof payload.email === "string" ? payload.email : "";
    const name = typeof payload.name === "string" ? payload.name : "";

    if (!Number.isSafeInteger(id) || !email || !name) {
      return null;
    }

    return { id, email, name };
  } catch {
    return null;
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AdminUser> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new AuthError("INVALID_CREDENTIALS", "邮箱或密码错误", 400);
  }

  const valid = await verifyPassword(password, user.password);

  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS", "邮箱或密码错误", 400);
  }

  return serializeUser(user);
}

export async function getCurrentUser(token?: string): Promise<AdminUser | null> {
  const session = await verifySessionToken(token);

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({ where: { id: session.id } });

  return user ? serializeUser(user) : null;
}

export async function requireAdmin(token?: string): Promise<AdminUser> {
  const user = await getCurrentUser(token);

  if (!user) {
    throw new AuthError("UNAUTHORIZED", "请先登录");
  }

  return user;
}
