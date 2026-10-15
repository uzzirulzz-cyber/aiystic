export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCreditSummary } from "@/lib/credits";

// GET /api/credits — returns the user's API credit summary
export async function GET() {
  try {
    const user = await requireUser();
    const summary = await getCreditSummary(user.id);
    if (!summary) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ credit: summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
