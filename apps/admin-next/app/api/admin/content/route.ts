import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const status = searchParams.get("status") || "all";
    const sort = searchParams.get("sort") || "newest";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status === "published") where.published = true;
    else if (status === "draft") where.published = false;
    else if (status === "scheduled") where.scheduledAt = { not: null };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    let orderBy: Record<string, string> = { createdAt: "desc" };
    if (sort === "oldest") orderBy = { createdAt: "asc" };
    else if (sort === "views") orderBy = { views: "desc" };
    else if (sort === "title") orderBy = { title: "asc" };

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          published: true,
          featured: true,
          views: true,
          likes: true,
          createdAt: true,
          updatedAt: true,
          scheduledAt: true,
          coverImage: true,
          summary: true,
          author: {
            select: { id: true, name: true, email: true, profilePicture: true },
          },
          tags: { select: { id: true, name: true } },
          _count: { select: { comments: true } },
        },
      }),
      prisma.blog.count({ where }),
    ]);

    return NextResponse.json({
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Content list error:", err);
    return NextResponse.json({ error: "Failed to fetch content" }, { status: 500 });
  }
}
