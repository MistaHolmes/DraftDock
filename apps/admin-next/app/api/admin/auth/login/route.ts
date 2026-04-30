import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Simple hardcoded login for Admin Panel
    if (username === "admin" && password === "admin") {
      const token = signToken({ username, role: "ADMIN" });
      return NextResponse.json({ token, message: "Login successful" });
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
