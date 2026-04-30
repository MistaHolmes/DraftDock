import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: { blogs: true, comments: true, followers: true, following: true },
        },
        blogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            published: true,
            views: true,
            createdAt: true,
          },
        },
      },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const viewsAgg = await prisma.blog.aggregate({
      where: { authorId: user.id },
      _sum: { views: true },
    });

    return NextResponse.json({ ...user, totalViews: viewsAgg._sum.views || 0 });
  } catch (err) {
    console.error("User detail error:", err);
    return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
