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
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.user.update({
      where: { id },
      data: { isVerified: !user.isVerified },
      select: { id: true, email: true, name: true, isVerified: true },
    });
    return NextResponse.json({
      message: `User ${updated.isVerified ? "verified" : "unverified"}`,
      user: updated,
    });
  } catch (err) {
    console.error("Verify toggle error:", err);
    return NextResponse.json(
      { error: "Failed to toggle verification" },
      { status: 500 }
    );
  }
}
