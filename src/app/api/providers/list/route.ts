import { NextResponse } from "next/server";
import { PROVIDERS } from "@/lib/types";

export async function GET() {
  // Return provider metadata with simulated connection status
  const providers = Object.values(PROVIDERS).map((p) => ({
    ...p,
    connected: true,
    enabled: true,
    lastChecked: new Date().toISOString(),
  }));

  return NextResponse.json({ providers });
}
