import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Download artifact content
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const artifactId = searchParams.get("artifactId");

    if (!taskId || !artifactId) {
      return NextResponse.json({ error: "Missing taskId or artifactId" }, { status: 400 });
    }

    const task = await db.task.findFirst({ where: { id: taskId, userId: user.id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const artifacts = JSON.parse(task.artifactsJson || "[]");
    const artifact = artifacts.find((a: { id: string }) => a.id === artifactId);
    if (!artifact) return NextResponse.json({ error: "Artifact not found" }, { status: 404 });

    return NextResponse.json({ artifact });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
