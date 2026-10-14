import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isR2Configured } from "@/lib/r2";

// Public health endpoint — does not require auth.
// Used by Docker healthcheck and load balancers.
export async function GET() {
  const checks: { name: string; ok: boolean; latencyMs?: number; error?: string }[] = [];

  // Database check
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.push({ name: "database", ok: true, latencyMs: Date.now() - dbStart });
  } catch (err) {
    checks.push({
      name: "database",
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    });
  }

  // R2 check (informational only)
  checks.push({ name: "r2_storage", ok: isR2Configured() });

  const allOk = checks.every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
