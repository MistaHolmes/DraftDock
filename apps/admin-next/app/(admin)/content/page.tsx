"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAdmin } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function ContentPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [currentStatus, setCurrentStatus] = useState("all");
  const [currentSort, setCurrentSort] = useState("newest");
  const [currentSearch, setCurrentSearch] = useState("");
  const { showToast } = useToast();

  const loadContent = useCallback(async () => {
    try {
      const data = await fetchAdmin(
        `/content?page=${currentPage}&limit=12&status=${currentStatus}&sort=${currentSort}&search=${currentSearch}`
      );
      setBlogs(data.blogs || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load content", "error");
    }
  }, [currentPage, currentStatus, currentSort, currentSearch, showToast]);

  const loadFeatured = useCallback(async () => {
    try {
      const data = await fetchAdmin("/content/featured");
      setFeatured(data.blogs || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadContent();
    loadFeatured();
  }, [loadContent, loadFeatured]);

  async function toggleFeatured(id: string) {
    try {
      await fetchAdmin(`/content/${id}/featured`, { method: "PATCH" });
      showToast("Featured status updated");
      loadContent();
      loadFeatured();
    } catch {
      showToast("Failed to update featured", "error");
    }
  }

  async function deleteBlog(id: string) {
    if (!confirm("Delete this blog permanently?")) return;
    try {
      await fetchAdmin(`/content/${id}`, { method: "DELETE" });
      showToast("Blog deleted");
      loadContent();
    } catch {
      showToast("Failed to delete blog", "error");
    }
  }

  const statusBadge = (blog: any) => {
    if (blog.published) return { label: "Published", color: "var(--success)", bg: "var(--success-bg)" };
    if (blog.scheduledAt) return { label: "Scheduled", color: "var(--info)", bg: "var(--info-bg)" };
    return { label: "Draft", color: "var(--warning)", bg: "var(--warning-bg)" };
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: 32 }}>
      {/* Header */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.025em" }}>
            Content Management
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>
            Manage your posts and featured content
          </p>
        </div>
        <button
          className="btn"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "9px 16px",
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--foreground)",
            cursor: "pointer",
            transition: "background 150ms ease",
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--muted)")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--card)")}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>file_download</span>
          Export
        </button>
      </section>

      {/* Featured Posts */}
      <section>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--foreground)" }}>Featured Posts</h3>
          <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 100, backgroundColor: "var(--primary)", color: "white" }}>
            {featured.length} Live
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {featured.length === 0 ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  backgroundColor: "var(--card)",
                  padding: 16,
                  borderRadius: 14,
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ height: 128, width: "100%", backgroundColor: "var(--muted)", borderRadius: 10, marginBottom: 12 }} />
                <div style={{ height: 14, width: "75%", backgroundColor: "var(--muted)", borderRadius: 6, marginBottom: 8 }} />
                <div style={{ height: 11, width: "50%", backgroundColor: "var(--muted)", borderRadius: 6 }} />
              </div>
            ))
          ) : (
            featured.slice(0, 3).map((blog: any) => {
              const authorName = blog.author?.name || blog.author?.email || "Unknown";
              const cover = blog.coverImage || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=200&fit=crop";
              return (
                <div
                  key={blog.id}
                  style={{
                    backgroundColor: "var(--card)",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid var(--border)",
                    boxShadow: "var(--shadow-sm)",
                    transition: "box-shadow 200ms ease, transform 200ms ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-md)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-sm)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  <img src={cover} alt={blog.title} style={{ width: "100%", height: 128, objectFit: "cover" }} />
                  <div style={{ padding: "16px 20px" }}>
                    <h4 style={{ fontWeight: 800, color: "var(--foreground)", fontSize: 15, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: 6, lineHeight: 1.4 }}>
                      {blog.title}
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", fontWeight: 500 }}>
                      {authorName} · {formatNumber(blog.views)} views
                    </p>
                    <button
                      onClick={() => toggleFeatured(blog.id)}
                      style={{
                        marginTop: 16,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--primary)",
                        background: "var(--primary-bg, rgba(119, 66, 166, 0.1))",
                        border: "none",
                        borderRadius: 6,
                        cursor: "pointer",
                        padding: "6px 14px",
                        fontFamily: "var(--font-sans)",
                        width: "100%",
                      }}
                    >
                      Unpin from Featured
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Table */}
      <section
        style={{
          backgroundColor: "var(--card)",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
        }}
      >
        {/* Table Toolbar */}
        <div
          style={{
            padding: "16px 20px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)" }}>Filter:</span>
            {[
              { value: currentStatus, onChange: (v: string) => { setCurrentStatus(v); setCurrentPage(1); }, options: [
                { value: "all", label: "All Status" },
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft" },
                { value: "scheduled", label: "Scheduled" },
              ]},
              { value: currentSort, onChange: (v: string) => { setCurrentSort(v); setCurrentPage(1); }, options: [
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "views", label: "Most Viewed" },
              ]},
            ].map((sel, i) => (
              <select
                key={i}
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
                style={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--foreground)",
                  padding: "6px 10px",
                  outline: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {sel.options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <span
              className="material-symbols-outlined"
              style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "var(--muted-foreground)", pointerEvents: "none" }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search posts..."
              value={currentSearch}
              onChange={(e) => { setCurrentSearch(e.target.value); setCurrentPage(1); }}
              className="input"
              style={{ paddingLeft: 34, paddingTop: 7, paddingBottom: 7, width: 240, fontSize: 12 }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-inset, var(--muted))", borderBottom: "1px solid var(--border)" }}>
                {["Post", "Status", "Views", "Comments", "Date", "Actions"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 18px",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--muted-foreground)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {blogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 32, color: "var(--muted-foreground)", fontSize: 13 }}>
                    No posts found
                  </td>
                </tr>
              ) : (
                blogs.map((blog: any) => {
                  const badge = statusBadge(blog);
                  const authorName = blog.author?.name || blog.author?.email || "Unknown";
                  const authorImg = blog.author?.profilePicture ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=7742a6&color=fff&size=32`;
                  const date = new Date(blog.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <tr
                      key={blog.id}
                      style={{ borderBottom: "1px solid var(--border)", transition: "background 150ms ease" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--muted)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent")}
                    >
                      {/* Post */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <img src={authorImg} alt={authorName} style={{ width: 32, height: 32, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {blog.title}
                            </p>
                            <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{authorName}</p>
                          </div>
                        </div>
                      </td>
                      {/* Status */}
                      <td style={{ padding: "14px 18px" }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 100,
                          color: badge.color,
                          backgroundColor: badge.bg,
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--muted-foreground)" }}>{formatNumber(blog.views)}</td>
                      <td style={{ padding: "14px 18px", fontSize: 13, color: "var(--muted-foreground)" }}>{blog._count?.comments || 0}</td>
                      <td style={{ padding: "14px 18px", fontSize: 12, color: "var(--muted-foreground)", whiteSpace: "nowrap" }}>{date}</td>
                      {/* Actions */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <button
                            onClick={() => toggleFeatured(blog.id)}
                            title={blog.featured ? "Unfeature" : "Feature"}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "background 150ms ease",
                              color: blog.featured ? "var(--primary)" : "var(--muted-foreground)",
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "color-mix(in srgb, var(--primary) 10%, transparent)")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent")}
                          >
                            <span
                              className="material-symbols-outlined"
                              style={{ fontSize: 18, fontVariationSettings: blog.featured ? "'FILL' 1" : "'FILL' 0" }}
                            >
                              star
                            </span>
                          </button>
                          <button
                            onClick={() => deleteBlog(blog.id)}
                            title="Delete"
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 7,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--muted-foreground)",
                              transition: "background 150ms ease, color 150ms ease",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--danger-bg)";
                              (e.currentTarget as HTMLButtonElement).style.color = "var(--danger)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
                              (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-foreground)";
                            }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          style={{
            padding: "12px 20px",
            backgroundColor: "var(--card)",
            borderTop: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Page {pagination.page || 1} of {pagination.totalPages || 1} ({pagination.total || 0} posts)
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "Previous", disabled: currentPage <= 1, onClick: () => setCurrentPage((p) => Math.max(1, p - 1)) },
              { label: "Next", disabled: currentPage >= (pagination.totalPages || 1), onClick: () => setCurrentPage((p) => p + 1) },
            ].map((btn) => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                disabled={btn.disabled}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid var(--border)",
                  backgroundColor: btn.disabled ? "transparent" : "var(--card)",
                  color: btn.disabled ? "var(--muted-foreground)" : "var(--primary)",
                  cursor: btn.disabled ? "not-allowed" : "pointer",
                  opacity: btn.disabled ? 0.5 : 1,
                  fontFamily: "var(--font-sans)",
                  transition: "background 150ms ease",
                }}
                onMouseEnter={(e) => { if (!btn.disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "color-mix(in srgb, var(--primary) 8%, transparent)"; }}
                onMouseLeave={(e) => { if (!btn.disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--card)"; }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
