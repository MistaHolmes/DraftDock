import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const { role } = await request.json();
    if (!role || !["ADMIN", "AUTHOR", "CONTRIBUTOR"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    });
    return NextResponse.json({
      message: `Role updated to ${role}`,
      user: updated,
    });
  } catch (err) {
    console.error("Role change error:", err);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
}
