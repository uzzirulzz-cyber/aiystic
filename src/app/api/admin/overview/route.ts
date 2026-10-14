import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Get admin overview stats
export async function GET() {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [totalUsers, activeUsers, totalTasks, completedTasks, failedTasks, runningTasks, totalProjects, totalUsage] =
      await Promise.all([
        db.user.count(),
        db.user.count({ where: { status: "ACTIVE" } }),
        db.task.count(),
        db.task.count({ where: { status: "COMPLETED" } }),
        db.task.count({ where: { status: "FAILED" } }),
        db.task.count({ where: { status: { in: ["RUNNING", "PLANNING", "VERIFYING"] } } }),
        db.project.count(),
        db.usageRecord.aggregate({ _sum: { cost: true, inputTokens: true, outputTokens: true } }),
      ]);

    // Tasks by status
    const tasksByStatusRaw = await db.task.groupBy({
      by: ["status"],
      _count: true,
    });
    const tasksByStatus = Object.fromEntries(tasksByStatusRaw.map((t) => [t.status, t._count]));

    // Provider usage
    const usageByProviderRaw = await db.usageRecord.groupBy({
      by: ["provider"],
      _count: true,
      _sum: { inputTokens: true, outputTokens: true, cost: true },
    });
    const usageByProvider = Object.fromEntries(usageByProviderRaw.map((p) => [p.provider, p]));

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        failedTasks,
        runningTasks,
        totalProjects,
        totalCost: totalUsage._sum.cost || 0,
        totalInputTokens: totalUsage._sum.inputTokens || 0,
        totalOutputTokens: totalUsage._sum.outputTokens || 0,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        failureRate: totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0,
      },
      tasksByStatus,
      usageByProvider,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
