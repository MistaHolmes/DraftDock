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
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });

    const updated = await prisma.blog.update({
      where: { id },
      data: { featured: !blog.featured },
      select: { id: true, title: true, featured: true },
    });
    return NextResponse.json({
      message: `Blog ${updated.featured ? "featured" : "unfeatured"}`,
      blog: updated,
    });
  } catch (err) {
    console.error("Toggle featured error:", err);
    return NextResponse.json(
      { error: "Failed to toggle featured" },
      { status: 500 }
    );
  }
}
