import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const [totalUsers, totalBlogs, totalViewsAgg, draftsCount, totalComments] =
      await Promise.all([
        prisma.user.count(),
        prisma.blog.count({ where: { published: true } }),
        prisma.blog.aggregate({ _sum: { views: true } }),
        prisma.blog.count({ where: { published: false } }),
        prisma.comment.count(),
      ]);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const [newUsersMonth, prevUsersMonth, newBlogsMonth, prevBlogsMonth] =
      await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: oneMonthAgo } } }),
        prisma.user.count({
          where: { createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo } },
        }),
        prisma.blog.count({
          where: { published: true, createdAt: { gte: oneMonthAgo } },
        }),
        prisma.blog.count({
          where: {
            published: true,
            createdAt: { gte: twoMonthsAgo, lt: oneMonthAgo },
          },
        }),
      ]);

    const userGrowth =
      prevUsersMonth > 0
        ? (((newUsersMonth - prevUsersMonth) / prevUsersMonth) * 100).toFixed(1)
        : newUsersMonth > 0
          ? "100.0"
          : "0.0";
    const blogGrowth =
      prevBlogsMonth > 0
        ? (((newBlogsMonth - prevBlogsMonth) / prevBlogsMonth) * 100).toFixed(1)
        : newBlogsMonth > 0
          ? "100.0"
          : "0.0";

    return NextResponse.json({
      totalUsers,
      totalBlogs,
      totalViews: totalViewsAgg._sum.views || 0,
      draftsCount,
      totalComments,
      newUsersMonth,
      newBlogsMonth,
      userGrowth: parseFloat(userGrowth),
      blogGrowth: parseFloat(blogGrowth),
    });
  } catch (err) {
    console.error("Analytics overview error:", err);
    return NextResponse.json(
      { error: "Failed to fetch analytics overview" },
      { status: 500 }
    );
  }
}
