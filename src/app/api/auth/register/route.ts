export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createUser, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const { user, session } = await createUser(email, password, name);
    await setSessionCookie(session.token);

    return NextResponse.json({ user, message: "Account created successfully" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Registration failed";
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
