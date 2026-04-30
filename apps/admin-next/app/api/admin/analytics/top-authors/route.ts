import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const authors = await prisma.user.findMany({
      where: { blogs: { some: { published: true } } },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        _count: { select: { blogs: true } },
      },
      take: 5,
    });

    const authorsWithViews = await Promise.all(
      authors.map(async (author) => {
        const agg = await prisma.blog.aggregate({
          where: { authorId: author.id, published: true },
          _sum: { views: true },
        });
        return { ...author, totalViews: agg._sum.views || 0 };
      })
    );

    authorsWithViews.sort((a, b) => b.totalViews - a.totalViews);

    return NextResponse.json({ authors: authorsWithViews });
  } catch (err) {
    console.error("Top authors error:", err);
    return NextResponse.json(
      { error: "Failed to fetch top authors" },
      { status: 500 }
    );
  }
}
