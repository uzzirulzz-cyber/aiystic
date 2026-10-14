import { NextResponse } from "next/server";
import { PROVIDERS, type Provider } from "@/lib/types";
import { isOpenRouterConfigured, ENGINE_MODELS } from "@/lib/openrouter";
import { db } from "@/lib/db";

export async function GET() {
  const live = isOpenRouterConfigured();

  // Read latest provider status from DB (updated by health-check)
  const dbConfigs = await db.providerConfig.findMany();
  const dbMap = Object.fromEntries(dbConfigs.map((p) => [p.name, p]));

  const providers = Object.values(PROVIDERS).map((p) => {
    const engineModel = ENGINE_MODELS[p.id as Provider];
    const dbConfig = dbMap[p.id];
    const configJson = dbConfig?.configJson ? JSON.parse(dbConfig.configJson) : {};
    return {
      ...p,
      connected: dbConfig?.connected ?? live,
      enabled: dbConfig?.enabled ?? true,
      fullyConfigured: live,
      liveResult: dbConfig?.connected ?? live,
      lastChecked: dbConfig?.lastChecked?.toISOString() || new Date().toISOString(),
      model: engineModel?.model || configJson.model || null,
      modelDisplayName: engineModel?.displayName || dbConfig?.displayName || null,
      alternatives: engineModel?.alternatives || [],
      capabilities: configJson.capabilities || p.capabilities,
      gateway: p.id === "GLM" ? "z-ai-sdk" : "openrouter",
    };
  });

  return NextResponse.json({
    providers,
    openrouter: {
      configured: live,
      unifiedGateway: true,
      message: live
        ? "All 5 engines are live via OpenRouter + z-ai-sdk"
        : "Set OPENROUTER_API_KEY to enable all engines",
    },
  });
}
