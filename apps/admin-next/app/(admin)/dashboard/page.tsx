"use client";

import { useEffect, useState } from "react";
import { fetchAdmin } from "@/lib/api";
import { formatNumber, timeAgo } from "@/lib/utils";
import { useToast } from "@/components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartPeriod, setChartPeriod] = useState<"7" | "30">("7");
  const { showToast } = useToast();

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    async function load() {
      try {
        const [s, t, a, act] = await Promise.all([
          fetchAdmin("/stats"),
          fetchAdmin("/analytics/top-tags"),
          fetchAdmin("/analytics/top-authors"),
          fetchAdmin("/analytics/recent-activity"),
        ]);
        setStats(s);
        setTags(t.tags || []);
        setAuthors(a.authors || []);
        setActivity(act.activity || []);
      } catch {
        showToast("Failed to load dashboard data", "error");
      }
    }
    load();
  }, [showToast]);

  useEffect(() => {
    async function loadChart() {
      try {
        const chart = await fetchAdmin(`/analytics/views-over-time?days=${chartPeriod === "7" ? 7 : 30}`);
        setChartData(chart.data || []);
      } catch { /* ignore */ }
    }
    loadChart();
  }, [chartPeriod]);

  const views = chartData.map((d: any) => d.views);
  const maxViews = Math.max(...views, 1);
  const topTag = tags[0];
  const topAuthor = authors[0];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header */}
      <div className="px-8 py-8 space-y-2">
        <h1 className="heading-xl text-foreground">
          {greeting}, Admin 👋
        </h1>
        {stats && (
          <p className="text-base text-muted-foreground">
            Your content engagement {stats.blogGrowth >= 0 ? "increased" : "decreased"}{" "}
            <span className={`font-semibold ${stats.blogGrowth >= 0 ? "text-success" : "text-danger"}`}>
              {stats.blogGrowth >= 0 ? "+" : ""}{stats.blogGrowth}%
            </span>{" "}
            this week
          </p>
        )}
      </div>

      <div className="px-8 pb-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {!stats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-muted"></div>
                    <div className="w-16 h-6 rounded-full bg-muted"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 w-20 rounded bg-muted"></div>
                    <div className="h-8 w-16 rounded bg-muted"></div>
                    <div className="h-3 w-32 rounded bg-muted"></div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <KPICard
                icon="visibility"
                iconColor="text-violet-600"
                iconBg="bg-violet-100"
                label="Total Views"
                value={formatNumber(stats.totalViews)}
                trend={stats.blogGrowth}
                comparison="vs last week"
                insight={topTag ? `Top source: #${topTag.name}` : "Keep publishing"}
              />
              <KPICard
                icon="group"
                iconColor="text-blue-600"
                iconBg="bg-blue-100"
                label="Total Users"
                value={formatNumber(stats.totalUsers)}
                trend={stats.userGrowth}
                comparison="vs last week"
                insight="Growing community"
              />
              <KPICard
                icon="article"
                iconColor="text-emerald-600"
                iconBg="bg-emerald-100"
                label="Published"
                value={formatNumber(stats.totalBlogs)}
                trend={0}
                comparison="total posts"
                insight={`${stats.draftsCount} drafts`}
              />
              <KPICard
                icon="trending_up"
                iconColor="text-amber-600"
                iconBg="bg-amber-100"
                label="Engagement"
                value={stats.totalComments > 0 ? `${((stats.totalComments / stats.totalViews) * 100).toFixed(1)}%` : "0%"}
                trend={null}
                comparison="comment rate"
                insight="Strong interaction"
              />
            </>
          )}
        </div>

        {/* Content Insights */}
        {stats && topTag && (
          <div className="card p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  lightbulb
                </span>
              </div>
              <div className="flex-1">
                <h3 className="heading-md text-foreground mb-2">Content Insights</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">Most viewed:</span> #{topTag.name} ({topTag.blogCount} posts)
                  </p>
                  {topAuthor && (
                    <p>
                      <span className="font-semibold text-foreground">Top contributor:</span> {topAuthor.name || topAuthor.email}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart + Contributors */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="lg:col-span-2 card p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="heading-md text-foreground">Platform Growth</h3>
                <p className="caption mt-1">Daily views over time</p>
              </div>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                <button
                  onClick={() => setChartPeriod("7")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    chartPeriod === "7"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setChartPeriod("30")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    chartPeriod === "30"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="h-64 flex items-end gap-1 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-full border-t border-border/50"></div>
                ))}
              </div>
              {chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  Loading chart...
                </div>
              ) : (
                views.map((v: number, i: number) => {
                  const height = Math.max(5, (v / maxViews) * 100);
                  const isMax = v === maxViews && v > 0;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-md transition-all hover:opacity-80 cursor-pointer relative group ${
                        isMax ? "bg-primary" : "bg-primary/30"
                      }`}
                      style={{ height: `${height}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {formatNumber(v)} views
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Contributors */}
          <div className="card p-6 space-y-4">
            <div>
              <h3 className="heading-md text-foreground">Top Contributors</h3>
              <p className="caption mt-1">This Week</p>
            </div>
            <div className="space-y-3">
              {authors.slice(0, 5).map((author: any, i: number) => {
                const imgSrc = author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || author.email)}&background=7c3aed&color=fff`;
                const isTop = i === 0;
                return (
                  <div key={author.id} className={`flex items-center justify-between p-3 rounded-lg transition-all ${isTop ? "bg-primary/5" : "hover:bg-muted"}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img className="w-10 h-10 rounded-lg object-cover" src={imgSrc} alt={author.name || author.email} />
                        {i < 3 && (
                          <div className={`absolute -top-1 -right-1 w-5 h-5 ${i === 0 ? "bg-primary" : "bg-muted-foreground"} text-white text-xs font-bold rounded-full flex items-center justify-center`}>
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{author.name || author.email}</p>
                        <p className="text-xs text-muted-foreground">{author._count?.blogs || 0} articles</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatNumber(author.totalViews)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity + Trending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity */}
          <div className="card p-6 space-y-4">
            <h3 className="heading-md text-foreground">Recent Activity</h3>
            <div className="space-y-4">
              {activity.slice(0, 6).map((item: any, i: number) => {
                const iconMap: Record<string, { icon: string; color: string }> = {
                  user_joined: { icon: "person_add", color: "text-blue-600" },
                  blog_published: { icon: "check_circle", color: "text-success" },
                };
                const meta = iconMap[item.type] || { icon: "info", color: "text-muted-foreground" };
                return (
                  <div key={i} className="flex items-start gap-3 relative">
                    {i < activity.length - 1 && (
                      <div className="absolute left-4 top-10 bottom-0 w-px bg-border"></div>
                    )}
                    <div className={`w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 relative z-10`}>
                      <span className={`material-symbols-outlined text-lg ${meta.color}`}>{meta.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm text-foreground">{item.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Trending */}
          <div className="card p-6 space-y-4">
            <h3 className="heading-md text-foreground">Trending Topics</h3>
            <div className="space-y-3">
              {tags.slice(0, 6).map((tag: any, i: number) => {
                const percentage = tags.length > 0 ? (tag.blogCount / tags.reduce((sum: number, t: any) => sum + t.blogCount, 0)) * 100 : 0;
                return (
                  <div key={tag.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${i === 0 ? "text-primary" : "text-foreground"}`}>
                          #{tag.name}
                        </span>
                        {i === 0 && (
                          <span className="badge badge-info">Hot</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{tag.blogCount} posts</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${i === 0 ? "bg-primary" : "bg-muted-foreground/30"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editorial Pipeline */}
        {stats && (
          <div className="card p-6 space-y-4">
            <h3 className="heading-md text-foreground">Editorial Pipeline</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-3xl font-bold text-warning">{stats.draftsCount}</p>
                <p className="text-sm text-muted-foreground mt-1">Drafts</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-3xl font-bold text-primary">0</p>
                <p className="text-sm text-muted-foreground mt-1">Scheduled</p>
              </div>
              <div className="text-center p-4 bg-muted/40 rounded-lg">
                <p className="text-3xl font-bold text-success">{stats.totalBlogs}</p>
                <p className="text-sm text-muted-foreground mt-1">Published</p>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden flex">
              <div className="bg-warning" style={{ width: `${(stats.draftsCount / (stats.draftsCount + stats.totalBlogs)) * 100}%` }}></div>
              <div className="bg-success" style={{ width: `${(stats.totalBlogs / (stats.draftsCount + stats.totalBlogs)) * 100}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({
  icon,
  iconColor,
  iconBg,
  label,
  value,
  trend,
  comparison,
  insight,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  trend: number | null;
  comparison: string;
  insight: string;
}) {
  return (
    <div className="card p-6 hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {trend !== null && (
          <span
            className={`badge ${
              trend >= 0 ? "badge-success" : "badge-danger"
            }`}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <p className="caption mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
        <p className="text-xs text-muted-foreground mb-2">{comparison}</p>
        <p className="text-xs text-primary font-medium">{insight}</p>
      </div>
    </div>
  );
}
