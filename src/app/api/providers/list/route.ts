export const runtime = "edge";

import { NextResponse } from "next/server";
import { PROVIDERS, type Provider } from "@/lib/types";
import { isOpenRouterConfigured, ENGINE_MODELS } from "@/lib/openrouter";
import { db } from "@/lib/db";

export async function GET() {
  const live = isOpenRouterConfigured();

  // Read latest provider status from DB
  let dbConfigs: any[] = [];
  let dbMap: Record<string, any> = {};
  try {
    dbConfigs = await db.providerConfig.findMany();
    dbMap = Object.fromEntries(dbConfigs.map((p) => [p.name, p]));
  } catch (err) {
    // DB might not be available yet
  }

  const providers = Object.values(PROVIDERS).map((p) => {
    const engineModel = ENGINE_MODELS[p.id as Provider];
    const dbConfig = dbMap[p.id];
    let configJson: any = {};
    try {
      configJson = dbConfig?.configJson ? JSON.parse(dbConfig.configJson) : {};
    } catch {}

    // D1 returns integers (0/1) for booleans, strings for dates
    const isConnected = dbConfig ? !!dbConfig.connected : live;
    const isEnabled = dbConfig ? !!dbConfig.enabled : true;
    const lastChecked = dbConfig?.lastChecked
      ? (typeof dbConfig.lastChecked === "string" ? dbConfig.lastChecked : new Date(dbConfig.lastChecked).toISOString())
      : new Date().toISOString();

    return {
      ...p,
      connected: isConnected,
      enabled: isEnabled,
      fullyConfigured: live,
      liveResult: isConnected,
      lastChecked,
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
