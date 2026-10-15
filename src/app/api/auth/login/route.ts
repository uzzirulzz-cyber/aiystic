export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await loginUser(email, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials or account suspended" }, { status: 401 });
    }

    await setSessionCookie(result.session.token);

    return NextResponse.json({ user: result.user, message: "Login successful" });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Login failed" }, { status: 500 });
  }
}
