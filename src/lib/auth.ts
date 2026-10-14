// Mystic AI - Auth helpers
import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { randomUUID, scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "mystic_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// Simple password hash (Node's scrypt — async-friendly, no native deps)
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    if (!stored.startsWith("scrypt$")) return false;
    const [, salt, hash] = stored.split("$");
    const testHashBuf = scryptSync(password, salt, 64);
    const storedBuf = Buffer.from(hash, "hex");
    if (testHashBuf.length !== storedBuf.length) return false;
    return timingSafeEqual(testHashBuf, storedBuf);
  } catch {
    return false;
  }
}

export async function createUser(email: string, password: string, name?: string, role: string = "USER") {
  const passwordHash = await hashPassword(password);
  // First user becomes super admin
  const userCount = await db.user.count();
  const assignedRole = userCount === 0 ? "SUPER_ADMIN" : role;

  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      passwordHash,
      role: assignedRole,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Bootstrap session
  const session = await createSession(user.id);

  return { user, session };
}

export async function createSession(userId: string) {
  const token = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: { userId, token, expiresAt },
  });

  return session;
}

export async function getSessionFromCookie(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof getUserByToken>>> } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const user = await getUserByToken(token);
  if (!user) return null;

  return { user };
}

export async function getUserByToken(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) return null;
  if (user.status === "SUSPENDED") return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const session = await createSession(user.id);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    },
    session,
  };
}

export async function logoutUser(token: string) {
  await db.session.deleteMany({ where: { token } });
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function requireUser() {
  const session = await getSessionFromCookie();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.user.status !== "ACTIVE") {
    throw new Error("ACCOUNT_SUSPENDED");
  }
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return user;
}
