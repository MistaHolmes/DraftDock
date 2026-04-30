import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const viewsAgg = await prisma.blog.aggregate({
        where: { published: true, createdAt: { gte: date, lt: nextDate } },
        _sum: { views: true },
      });

      const dailyViews = await prisma.dailyViewStat.aggregate({
        where: { date: { gte: date, lt: nextDate } },
        _sum: { views: true },
      });

      const totalDayViews =
        (dailyViews._sum.views || 0) + (viewsAgg._sum.views || 0);

      results.push({
        date: date.toISOString().split("T")[0],
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
        views: totalDayViews,
      });
    }

    return NextResponse.json({ data: results });
  } catch (err) {
    console.error("Views over time error:", err);
    return NextResponse.json(
      { error: "Failed to fetch view data" },
      { status: 500 }
    );
  }
}
