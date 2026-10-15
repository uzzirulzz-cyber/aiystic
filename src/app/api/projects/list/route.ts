export const runtime = "edge";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const projects = await db.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { files: true, tasks: true } },
      },
    });

    // D1 doesn't support Prisma's _count include — add it manually
    const projectsWithCounts = await Promise.all(
      (projects || []).map(async (p: any) => {
        if (p._count) return p; // Prisma already added it
        try {
          const d1 = await import("@cloudflare/next-on-pages").then(m => m.getRequestContext().env.DB).catch(() => null);
          if (d1) {
            const fileCount = await d1.prepare("SELECT COUNT(*) as c FROM ProjectFile WHERE projectId = ?").bind(p.id).first();
            const taskCount = await d1.prepare("SELECT COUNT(*) as c FROM Task WHERE projectId = ?").bind(p.id).first();
            return { ...p, _count: { files: fileCount?.c || 0, tasks: taskCount?.c || 0 } };
          }
        } catch {}
        return { ...p, _count: { files: 0, tasks: 0 } };
      })
    );

    return NextResponse.json({ projects: projectsWithCounts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
