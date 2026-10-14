import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");
    if (!taskId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const task = await db.task.findFirst({
      where: { id: taskId, userId: user.id },
      include: {
        project: { select: { id: true, name: true } },
        usageRecords: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ task });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { id, status } = body;

    const task = await db.task.findFirst({ where: { id, userId: user.id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.task.update({
      where: { id },
      data: { status },
    });
    return NextResponse.json({ task: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
