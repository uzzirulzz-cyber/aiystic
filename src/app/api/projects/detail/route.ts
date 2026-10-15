export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const project = await db.project.findFirst({
      where: { id: projectId, userId: user.id },
      include: {
        files: { orderBy: { path: "asc" } },
        tasks: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { id, name, description, status } = body;

    const project = await db.project.findFirst({ where: { id, userId: user.id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.project.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
      },
    });
    return NextResponse.json({ project: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("id");
    if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.project.delete({ where: { id: projectId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
