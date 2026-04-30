import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }
    if (roleFilter && ["ADMIN", "AUTHOR", "CONTRIBUTOR"].includes(roleFilter)) {
      where.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          profilePicture: true,
          createdAt: true,
          isVerified: true,
          writerLevel: true,
          bio: true,
          _count: { select: { blogs: true, comments: true, followers: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithViews = await Promise.all(
      users.map(async (user) => {
        const viewsAgg = await prisma.blog.aggregate({
          where: { authorId: user.id },
          _sum: { views: true },
        });
        return { ...user, totalViews: viewsAgg._sum.views || 0 };
      })
    );

    return NextResponse.json({
      users: usersWithViews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Users list error:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
