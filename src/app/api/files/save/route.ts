import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

// Save a file's content (from code editor)
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { fileId, content } = body;

    if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

    const file = await db.projectFile.findFirst({
      where: { id: fileId },
      include: { project: true },
    });

    if (!file || file.project.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await db.projectFile.update({
      where: { id: fileId },
      data: {
        content,
        version: file.version + 1,
      },
    });

    return NextResponse.json({ file: updated });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// Create a new file
export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const { projectId, path, content = "", language } = body;

    if (!projectId || !path) return NextResponse.json({ error: "Missing projectId or path" }, { status: 400 });

    const project = await db.project.findFirst({ where: { id: projectId, userId: user.id } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const existing = await db.projectFile.findFirst({ where: { projectId, path } });
    if (existing) return NextResponse.json({ error: "File already exists" }, { status: 409 });

    const file = await db.projectFile.create({
      data: {
        projectId,
        path,
        content,
        language: language || detectLanguage(path),
      },
    });

    return NextResponse.json({ file });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

// Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");
    if (!fileId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const file = await db.projectFile.findFirst({
      where: { id: fileId },
      include: { project: true },
    });

    if (!file || file.project.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.projectFile.delete({ where: { id: fileId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    json: "json",
    md: "markdown",
    html: "html",
    css: "css",
    py: "python",
    sql: "sql",
    yml: "yaml",
    yaml: "yaml",
    txt: "text",
  };
  return map[ext || ""] || "text";
}
