export const runtime = "edge";

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isOpenRouterConfigured, ENGINE_MODELS } from "@/lib/openrouter";
import { db } from "@/lib/db";
import { PROVIDERS, type Provider } from "@/lib/types";

// POST /api/providers/health-check — verifies all 5 providers are configured
// On Cloudflare Edge, we check that the API key is set and DB shows connected=true.
// (Actual API calls to OpenRouter are done during task execution, not health check,
// to avoid Edge runtime CPU time limits.)
export async function POST() {
  try {
    await requireAdmin();

    const apiConfigured = isOpenRouterConfigured();
    const providers: Provider[] = ["CLAUDE", "GEMINI", "GLM", "CODEX", "RESEARCH"];

    // Read DB status for each provider
    const results = [];
    for (const p of providers) {
      const dbConfig = await db.providerConfig.findUnique({ where: { name: p } });
      const engineModel = ENGINE_MODELS[p];
      const isConnected = apiConfigured && (dbConfig?.connected || dbConfig?.connected === 1 || dbConfig?.connected === true);

      results.push({
        provider: p,
        connected: isConnected,
        model: engineModel?.model || "unknown",
        latencyMs: 0,
        error: isConnected ? undefined : (apiConfigured ? "Not connected in DB" : "OPENROUTER_API_KEY not set"),
      });

      // Update the DB lastChecked timestamp
      try {
        await db.providerConfig.update({
          where: { name: p },
          data: { lastChecked: new Date(), connected: isConnected },
        });
      } catch {}
    }

    return NextResponse.json({ results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    if (msg === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (msg === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
