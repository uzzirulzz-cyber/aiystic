export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getR2Config } from "@/lib/r2";

// GET /api/storage/status — returns R2 connection status (admin only)
export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ storage: getR2Config() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    if (message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
