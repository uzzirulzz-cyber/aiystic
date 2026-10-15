export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { planTask } from "@/lib/fusion-engine";
import type { WorkMode } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { title, description, projectId, workMode } = body;

    if (!title || !description) {
      return NextResponse.json({ error: "Title and description are required" }, { status: 400 });
    }

    const mode: WorkMode = (workMode as WorkMode) || "BALANCED";
    const plan = planTask({ userRequest: description, workMode: mode });

    const task = await db.task.create({
      data: {
        userId: user.id,
        projectId: projectId || null,
        title: title.trim(),
        description: description.trim(),
        workMode: mode,
        planJson: JSON.stringify(plan.subtasks),
        acceptanceCriteria: JSON.stringify(plan.acceptanceCriteria),
        budgetTokens: plan.estimatedTokens,
      },
    });

    return NextResponse.json({ task, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
