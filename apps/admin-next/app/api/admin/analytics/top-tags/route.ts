import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, isAuthError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const auth = verifyToken(request);
  if (isAuthError(auth)) return auth;

  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { blogs: true } } },
      orderBy: { blogs: { _count: "desc" } },
      take: 10,
    });

    const result = tags.map((t) => ({
      id: t.id,
      name: t.name,
      blogCount: t._count.blogs,
    }));

    return NextResponse.json({ tags: result });
  } catch (err) {
    console.error("Top tags error:", err);
    return NextResponse.json({ error: "Failed to fetch top tags" }, { status: 500 });
  }
}
