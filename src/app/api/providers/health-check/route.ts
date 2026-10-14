import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkAllProvidersHealth } from "@/lib/providers";

// POST /api/providers/health-check — runs live health check on all 5 providers
export async function POST() {
  try {
    await requireAdmin();
    const results = await checkAllProvidersHealth();
    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
