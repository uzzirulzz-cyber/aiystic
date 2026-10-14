import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isOpenRouterConfigured, getOpenRouterConfig } from "@/lib/openrouter";

// GET /api/admin/budget — returns the API budget for the current user
// Super Admins get the full $250/month bonus; regular users get standard quota.
export async function GET() {
  try {
    const user = await requireUser();

    const isSuperAdmin = user.role === "SUPER_ADMIN";
    const isAdmin = user.role === "ADMIN" || isSuperAdmin;

    // Super Admin bonus budget from env (default $250/month)
    const superAdminBudget = parseFloat(process.env.SUPER_ADMIN_API_BUDGET_USD || "250.00");
    const period = process.env.SUPER_ADMIN_API_BUDGET_PERIOD || "monthly";

    // Calculate spent this period from usage records
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await db.usageRecord.aggregate({
      where: {
        userId: user.id,
        createdAt: { gte: periodStart },
      },
      _sum: {
        cost: true,
        inputTokens: true,
        outputTokens: true,
      },
      _count: true,
    });

    const spent = usage._sum.cost || 0;
    const budget = isSuperAdmin ? superAdminBudget : isAdmin ? 50.0 : 10.0;
    const remaining = Math.max(0, budget - spent);
    const usedPct = budget > 0 ? (spent / budget) * 100 : 0;

    return NextResponse.json({
      budget: {
        total: budget,
        spent: parseFloat(spent.toFixed(6)),
        remaining: parseFloat(remaining.toFixed(6)),
        usedPct: parseFloat(usedPct.toFixed(2)),
        period,
        periodStart: periodStart.toISOString(),
        periodEnd: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
        isBonus: isSuperAdmin,
        bonusLabel: isSuperAdmin ? `$${budget.toFixed(2)} ${period} API bonus` : null,
      },
      usage: {
        totalCalls: usage._count,
        totalInputTokens: usage._sum.inputTokens || 0,
        totalOutputTokens: usage._sum.outputTokens || 0,
        totalTokens: (usage._sum.inputTokens || 0) + (usage._sum.outputTokens || 0),
      },
      openrouter: getOpenRouterConfig(),
      role: user.role,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
