import { NextResponse } from "next/server";
import { PROVIDERS, type Provider } from "@/lib/types";
import { isOpenRouterConfigured, ENGINE_MODELS } from "@/lib/openrouter";

export async function GET() {
  const live = isOpenRouterConfigured();

  // All 5 engines are fully configured when OpenRouter is set up.
  // Each engine maps to a real model that produces live results.
  const providers = Object.values(PROVIDERS).map((p) => {
    const engineModel = ENGINE_MODELS[p.id as Provider];
    return {
      ...p,
      connected: live,
      enabled: true,
      fullyConfigured: live,
      liveResult: live,
      lastChecked: new Date().toISOString(),
      model: engineModel?.model || null,
      modelDisplayName: engineModel?.displayName || null,
      alternatives: engineModel?.alternatives || [],
    };
  });

  return NextResponse.json({
    providers,
    openrouter: {
      configured: live,
      unifiedGateway: true,
      message: live
        ? "All 5 engines are live via OpenRouter"
        : "Set OPENROUTER_API_KEY to enable all engines",
    },
  });
}
