import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { uploadArtifact, isR2Configured } from "@/lib/r2";

// POST /api/storage/upload — uploads an artifact to R2
export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();

    if (!isR2Configured()) {
      return NextResponse.json(
        { error: "R2 storage is not configured. Set R2_* env vars on the server." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { key, content, contentType } = body;

    if (!key || content === undefined) {
      return NextResponse.json({ error: "Missing key or content" }, { status: 400 });
    }

    // Sanitize key — prevent path traversal
    const safeKey = key.replace(/[^a-zA-Z0-9._\-\/]/g, "_").replace(/^\//, "");
    const finalKey = `${user.id}/${safeKey}`;

    const result = await uploadArtifact(finalKey, content, contentType || "text/plain");

    return NextResponse.json({ ...result, key: finalKey });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
