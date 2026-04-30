import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "super_secret_admin_key";

export interface AdminPayload {
  username: string;
  role: string;
}

/**
 * Verify JWT token from the Authorization header of a Next.js API route request.
 * Returns the decoded payload if valid, or a 401 NextResponse if invalid.
 */
export function verifyToken(
  request: NextRequest
): AdminPayload | NextResponse {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      { error: "No token provided" },
      { status: 401 }
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
    return decoded;
  } catch {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}

/**
 * Helper to check if verifyToken returned an error response.
 */
export function isAuthError(
  result: AdminPayload | NextResponse
): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Sign a JWT for admin login.
 */
export function signToken(payload: { username: string; role: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });
}
