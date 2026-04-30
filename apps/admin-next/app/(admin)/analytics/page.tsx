"use client";

import { useEffect, useState } from "react";
import { fetchAdmin } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [days, setDays] = useState(7);
  const { showToast } = useToast();

  useEffect(() => {
    async function load() {
      try {
        const [o, t, au, act] = await Promise.all([
          fetchAdmin("/analytics/overview"),
          fetchAdmin("/analytics/top-tags"),
          fetchAdmin("/analytics/top-authors"),
          fetchAdmin("/analytics/recent-activity"),
        ]);
        setOverview(o);
        setTags(t.tags || []);
        setAuthors(au.authors || []);
        setActivity(act.activity || []);
      } catch {
        showToast("Failed to load analytics", "error");
      }
    }
    load();
  }, [showToast]);

  useEffect(() => {
    async function loadChart() {
      try {
        const c = await fetchAdmin(`/analytics/views-over-time?days=${days}`);
        setChartData(c.data || []);
      } catch { /* ignore */ }
    }
    loadChart();
  }, [days]);

  const views = chartData.map((d: any) => d.views);
  const maxViews = Math.max(...views, 1);
  const totalTagBlogs = tags.reduce((acc: number, t: any) => acc + t.blogCount, 0) || 1;
  const tagColors = ["#702ae1", "#7742a6", "#9e3657", "#6411d5", "#b28cff", "#ddb3ff", "#f77c9e", "#ff8eac", "#a67aff", "#e6c5ff"];

  const maxAuthorViews = Math.max(...authors.map((a: any) => a.totalViews), 1);

  return (
    <div className="p-8 md:p-12 max-w-7xl mx-auto w-full space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight text-foreground mb-2">
            Performance <span className="italic text-primary">Intelligence</span>
          </h2>
          <p className="text-muted-foreground font-medium">Deep dive into your editorial ecosystem.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-muted p-1 rounded-xl flex">
            {[{ label: "7D", value: 7 }, { label: "30D", value: 30 }, { label: "12M", value: 90 }].map((btn) => (
              <button
                key={btn.value}
                onClick={() => setDays(btn.value)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                  days === btn.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold hover:bg-muted transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Real-time Stats Widget */}
        <div className="md:col-span-4 editorial-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative">
          {!overview ? (
            <div className="animate-pulse space-y-4">
              <div className="h-3 w-28 rounded bg-surface-container-low"></div>
              <div className="h-12 w-32 rounded-lg bg-surface-container-low"></div>
              <div className="h-3 w-36 rounded bg-surface-container-low"></div>
            </div>
          ) : (
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">Live Analytics</span>
              </div>
              <div className="mb-6">
                <h3 className="text-5xl font-black text-on-surface">{formatNumber(overview.totalViews)}</h3>
                <p className="text-sm text-on-surface-variant font-medium mt-1">Total Platform Views</p>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant font-bold">Published</span>
                  <span className="text-xs text-primary font-bold">{formatNumber(overview.totalBlogs)} of {formatNumber(overview.totalBlogs + overview.draftsCount)}</span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((overview.totalBlogs / (overview.totalBlogs + overview.draftsCount || 1)) * 100)}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Views Over Time Chart */}
        <div className="md:col-span-8 editorial-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-on-surface">Views Over Time</h3>
              <p className="text-sm text-on-surface-variant">Daily breakdown across selected period</p>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Views</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-container"></span> Avg</span>
            </div>
          </div>
          <div className="h-48 flex items-end justify-between gap-1">
            {chartData.length === 0 ? (
              [40, 55, 45, 70, 60, 85, 75].map((h, i) => (
                <div key={i} className="flex-1 bg-surface-container-low rounded-t-lg animate-pulse" style={{ height: `${h}%` }}></div>
              ))
            ) : (
              views.map((v: number, i: number) => {
                const height = Math.max(5, (v / maxViews) * 100);
                const isMax = v === maxViews && v > 0;
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group ${
                      isMax ? "bg-primary" : "bg-primary/20"
                    }`}
                    style={{ height: `${height}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-inverse-surface text-white text-[10px] px-2 py-1 rounded whitespace-nowrap font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatNumber(v)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {chartData.length > 0 && (
            <div className="flex justify-between mt-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {chartData.map((d: any, i: number) => (
                <span key={i} className="flex-1 text-center">{d.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Top Tags */}
        <div className="md:col-span-5 editorial-card rounded-2xl p-8">
          <h3 className="text-lg font-bold text-on-surface mb-2">Content Distribution</h3>
          <p className="text-sm text-on-surface-variant mb-8">Topic breakdown by published posts</p>
          <div className="flex items-center gap-8">
            {/* Donut Chart */}
            <div className="w-32 h-32 flex-shrink-0 relative">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {tags.length > 0 ? (() => {
                  let cumulative = 0;
                  return tags.slice(0, 5).map((tag: any, i: number) => {
                    const pct = (tag.blogCount / totalTagBlogs) * 100;
                    const offset = cumulative;
                    cumulative += pct;
                    return (
                      <circle
                        key={tag.id}
                        cx="18" cy="18" r="15.9"
                        fill="none"
                        stroke={tagColors[i]}
                        strokeWidth="3"
                        strokeDasharray={`${pct} ${100 - pct}`}
                        strokeDashoffset={`${-offset}`}
                        strokeLinecap="round"
                      />
                    );
                  });
                })() : (
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eef1f3" strokeWidth="3" />
                )}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-black text-on-surface">{tags.length}</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {tags.slice(0, 5).map((tag: any, i: number) => (
                <div key={tag.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: tagColors[i] }}></span>
                    <span className="text-sm font-semibold text-on-surface">#{tag.name}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant">{tag.blogCount}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Authors */}
        <div className="md:col-span-7 editorial-card rounded-2xl p-8">
          <h3 className="text-lg font-bold text-on-surface mb-6">Top Authors</h3>
          <div className="space-y-6">
            {authors.map((author: any) => {
              const pct = Math.round((author.totalViews / maxAuthorViews) * 100);
              const imgSrc = author.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(author.name || author.email)}&background=7742a6&color=fff`;
              return (
                <div key={author.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img className="w-6 h-6 rounded-full object-cover" src={imgSrc} alt={author.name || author.email} />
                      <span className="text-sm font-bold text-on-surface">{author.name || author.email}</span>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">{formatNumber(author.totalViews)} views</span>
                  </div>
                  <div className="h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Insights */}
        <div className="md:col-span-12 editorial-card rounded-2xl overflow-hidden">
          <div className="p-8 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
            <div>
              <h3 className="text-xl font-bold text-on-surface">Platform Insights</h3>
              <p className="text-sm text-on-surface-variant">Engagement metrics for the selected period</p>
            </div>
            <span className="text-xs bg-primary text-on-primary px-3 py-1.5 rounded-full font-bold">{days === 7 ? "Weekly" : days === 30 ? "Monthly" : "Annual"}</span>
          </div>
          {!overview ? (
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-8 space-y-3">
                  <div className="h-2 w-24 rounded bg-surface-container-low"></div>
                  <div className="h-8 w-16 rounded bg-surface-container-low"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">
              <div className="p-8">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Users</p>
                <p className="text-3xl font-black text-on-surface">{formatNumber(overview.totalUsers)}</p>
                <p className={`text-xs font-bold mt-1 ${overview.userGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>{overview.userGrowth >= 0 ? "+" : ""}{overview.userGrowth}% growth</p>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Published Blogs</p>
                <p className="text-3xl font-black text-on-surface">{formatNumber(overview.totalBlogs)}</p>
                <p className={`text-xs font-bold mt-1 ${overview.blogGrowth >= 0 ? "text-green-600" : "text-red-600"}`}>{overview.blogGrowth >= 0 ? "+" : ""}{overview.blogGrowth}% growth</p>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Total Comments</p>
                <p className="text-3xl font-black text-on-surface">{formatNumber(overview.totalComments)}</p>
              </div>
              <div className="p-8">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">Engagement Rate</p>
                <p className="text-3xl font-black text-on-surface">
                  {overview.totalViews > 0 ? ((overview.totalComments / overview.totalViews) * 100).toFixed(2) : "0"}%
                </p>
              </div>
            </div>
          )}
          {/* Performance Trend */}
          <div className="px-8 pb-10">
            <div className="h-32 w-full flex items-end gap-1">
              {chartData.length === 0 ? (
                [40, 45, 60, 55, 70, 75, 80, 85, 90, 100, 88, 82].map((h, i) => (
                  <div key={i} className="flex-1 bg-surface-container-low rounded-t-lg animate-pulse" style={{ height: `${h}%` }}></div>
                ))
              ) : (
                views.map((v: number, i: number) => {
                  const height = Math.max(3, (v / maxViews) * 100);
                  return (
                    <div key={i} className="flex-1 bg-primary/15 rounded-t-lg hover:bg-primary/30 transition-colors" style={{ height: `${height}%` }}></div>
                  );
                })
              )}
            </div>
            {chartData.length > 0 && (
              <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-bold">
                <span>{chartData[0]?.label}</span>
                <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
                <span>{chartData[chartData.length - 1]?.label}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <h3 className="text-xl font-bold text-on-surface mb-6">Recent Activity</h3>
        <div className="space-y-3">
          {activity.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl ring-1 ring-outline-variant/10">
              <span className={`material-symbols-outlined text-sm ${item.type === "blog_published" ? "text-green-500" : "text-blue-500"}`}>
                {item.type === "blog_published" ? "check_circle" : "person_add"}
              </span>
              <div className="flex-1">
                <p className="text-sm font-bold text-on-surface">{item.message}</p>
                {item.author && <p className="text-xs text-slate-500">By {item.author}</p>}
              </div>
              <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
