export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireAdmin();

    const recentTasks = await db.task.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, email: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ tasks: recentTasks });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { taskId, action } = body; // action: "cancel" | "retry"

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let newStatus = task.status;
    if (action === "cancel") newStatus = "CANCELLED";
    if (action === "retry") newStatus = "QUEUED";

    const updated = await db.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: `TASK_${action.toUpperCase()}`,
        target: taskId,
        details: JSON.stringify({ from: task.status, to: newStatus }),
      },
    });

    return NextResponse.json({ task: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
