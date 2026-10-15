export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { executeTask } from "@/lib/fusion-engine";

// Start task execution (non-blocking)
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { taskId } = body;

    if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

    const task = await db.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (task.status !== "QUEUED" && task.status !== "PAUSED" && task.status !== "FAILED") {
      return NextResponse.json({ error: "Task is already running or completed" }, { status: 400 });
    }

    // Mark as running immediately
    await db.task.update({
      where: { id: taskId },
      data: { status: "PLANNING", startedAt: new Date() },
    });

    // Kick off execution in the background (non-blocking)
    executeTask(taskId, task.description, task.workMode as "FAST" | "BALANCED" | "DEEP")
      .catch(async (err) => {
        console.error(`[Task ${taskId}] execution failed:`, err);
        await db.task.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMessage: err instanceof Error ? err.message : "Unknown execution error",
            completedAt: new Date(),
          },
        });
      });

    return NextResponse.json({ message: "Task execution started", taskId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// Get current task state (for polling)
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("id");
    if (!taskId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const task = await db.task.findFirst({
      where: { id: taskId, userId: user.id },
      select: {
        id: true,
        status: true,
        title: true,
        description: true,
        planJson: true,
        eventsJson: true,
        artifactsJson: true,
        verificationJson: true,
        usedTokens: true,
        budgetTokens: true,
        estimatedCost: true,
        updatedAt: true,
      },
    });

    if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      task: {
        ...task,
        plan: JSON.parse(task.planJson || "[]"),
        events: JSON.parse(task.eventsJson || "[]"),
        artifacts: JSON.parse(task.artifactsJson || "[]"),
        verification: JSON.parse(task.verificationJson || "{}"),
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
