import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const blogs = await prisma.blog.findMany({
      where: { featured: true, published: true },
      orderBy: { views: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        views: true,
        likes: true,
        coverImage: true,
        createdAt: true,
        author: {
          select: { name: true, email: true, profilePicture: true },
        },
        tags: { select: { name: true } },
      },
    });
    return NextResponse.json({ blogs });
  } catch (err) {
    console.error("Featured content error:", err);
    return NextResponse.json(
      { error: "Failed to fetch featured content" },
      { status: 500 }
    );
  }
}
