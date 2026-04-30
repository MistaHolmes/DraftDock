import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const [recentUsers, recentBlogs] = await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, email: true, name: true, createdAt: true },
      }),
      prisma.blog.findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
          author: { select: { name: true, email: true } },
          tags: { select: { name: true }, take: 1 },
        },
      }),
    ]);

    const activity = [
      ...recentUsers.map((u) => ({
        type: "user_joined",
        message: `${u.name || u.email} joined the platform`,
        timestamp: u.createdAt,
        icon: "person_add",
        color: "green",
      })),
      ...recentBlogs.map((b) => ({
        type: "blog_published",
        message: `"${b.title}"`,
        author: b.author.name || b.author.email,
        tag: b.tags[0]?.name || "General",
        timestamp: b.createdAt,
        icon: "check_circle",
        color: "green",
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return NextResponse.json({ activity });
  } catch (err) {
    console.error("Recent activity error:", err);
    return NextResponse.json(
      { error: "Failed to fetch recent activity" },
      { status: 500 }
    );
  }
}
