import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const users = await db.user.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [{ email: { contains: search } }, { name: { contains: search } }],
              }
            : {},
          role ? { role } : {},
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: { projects: true, tasks: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { userId, role, status } = body;

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Only super admins can change roles or suspend other admins
    if (role && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Only super admins can change roles" }, { status: 403 });
    }

    // Cannot demote yourself
    if (userId === admin.id && role && role !== admin.role) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: {
        ...(role && { role }),
        ...(status && { status }),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: "USER_ROLE_CHANGE",
        target: userId,
        details: JSON.stringify({ role, status, by: admin.email }),
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
