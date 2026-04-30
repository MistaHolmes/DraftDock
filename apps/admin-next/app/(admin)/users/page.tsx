"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchAdmin } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import { useToast } from "@/components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const { showToast } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchAdmin(`/users?page=${currentPage}&limit=20&search=${search}`);
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch {
      showToast("Failed to load users", "error");
    }
  }, [currentPage, search, showToast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function changeRole(id: string, role: string) {
    try {
      await fetchAdmin(`/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      showToast(`Role updated to ${role}`);
      loadUsers();
    } catch {
      showToast("Failed to update role", "error");
    }
  }

  async function toggleVerify(id: string) {
    try {
      await fetchAdmin(`/users/${id}/verify`, { method: "PATCH" });
      showToast("Verification status updated");
      loadUsers();
    } catch {
      showToast("Failed to toggle verification", "error");
    }
  }

  function exportCSV() {
    const headers = ["Name", "Email", "Role", "Blogs", "Views", "Verified", "Joined"];
    const rows = users.map((u: any) => [
      u.name || "",
      u.email,
      u.role,
      u._count?.blogs || 0,
      u.totalViews || 0,
      u.isVerified ? "Yes" : "No",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Users exported to CSV");
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px", display: "flex", flexDirection: "column", gap: 32, background: "var(--background)" }}>
      {/* Header */}
      <section style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.025em" }}>
            Team Management
          </h2>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>
            Manage your editorial team, roles, and permissions.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={exportCSV}
            className="btn"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
              backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: "var(--foreground)", cursor: "pointer",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>ios_share</span> Export
          </button>
          <button
            className="btn"
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "9px 16px",
              backgroundColor: "var(--primary)", border: "none", borderRadius: 10,
              fontSize: 13, fontWeight: 600, color: "white", cursor: "pointer",
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span> Add User
          </button>
        </div>
      </section>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div style={{ position: "relative", width: 280 }}>
          <span className="material-symbols-outlined" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 18, color: "var(--muted-foreground)", pointerEvents: "none" }}>search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Search users..."
            className="input"
            style={{ paddingLeft: 40 }}
          />
        </div>
      </div>

      {/* Users List (Replaced Grid with Table) */}
      <section style={{ backgroundColor: "var(--card)", borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-inset, var(--muted))", borderBottom: "1px solid var(--border)" }}>
                {["User", "Role", "Performance", "Joined", "Access"].map((h) => (
                  <th key={h} style={{ padding: "14px 20px", fontSize: 11, fontWeight: 800, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 40, color: "var(--muted-foreground)", fontSize: 14 }}>No users found.</td>
                </tr>
              ) : (
                users.map((user: any) => {
                  const imgSrc = user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email)}&background=7742a6&color=fff&size=40`;
                  const date = new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  return (
                    <tr key={user.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 150ms ease" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "var(--muted)")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent")}
                    >
                      {/* User Column */}
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <img src={imgSrc} alt={user.name || user.email} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>{user.name || "Unnamed"}</p>
                              {user.isVerified && <span className="material-symbols-outlined" style={{ fontSize: 14, color: "var(--primary)", fontVariationSettings: "'FILL' 1" }}>verified</span>}
                            </div>
                            <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Column */}
                      <td style={{ padding: "16px 20px" }}>
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value)}
                          style={{
                            backgroundColor: "var(--muted)", border: "1px solid var(--border)", borderRadius: 6,
                            padding: "4px 8px", fontSize: 11, fontWeight: 700, color: "var(--foreground)",
                            cursor: "pointer", fontFamily: "var(--font-sans)", minWidth: 110, outline: "none"
                          }}
                        >
                          <option value="AUTHOR">Author</option>
                          <option value="ADMIN">Admin</option>
                          <option value="CONTRIBUTOR">Contributor</option>
                        </select>
                      </td>

                      {/* Performance Column */}
                      <td style={{ padding: "16px 20px", fontSize: 13 }}>
                        <div style={{ display: "flex", gap: 24, color: "var(--foreground)", fontWeight: 600 }}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 700, textTransform: "uppercase" }}>Blogs</span>
                            {user._count?.blogs || 0}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={{ fontSize: 10, color: "var(--muted-foreground)", fontWeight: 700, textTransform: "uppercase" }}>Views</span>
                            {formatNumber(user.totalViews || 0)}
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td style={{ padding: "16px 20px", fontSize: 13, color: "var(--muted-foreground)" }}>{date}</td>

                      {/* Access Actions */}
                      <td style={{ padding: "16px 20px" }}>
                        <button
                          onClick={() => toggleVerify(user.id)}
                          style={{
                            padding: "6px 14px", borderRadius: 100, fontSize: 11, fontWeight: 700,
                            cursor: "pointer", border: "none", transition: "all 150ms ease",
                            backgroundColor: user.isVerified ? "var(--success-bg)" : "var(--muted)",
                            color: user.isVerified ? "var(--success)" : "var(--muted-foreground)"
                          }}
                        >
                          {user.isVerified ? "✓ Verified" : "Verify Account"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", backgroundColor: "var(--surface-inset, var(--muted))" }}>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Showing {users.length} of {pagination.total || 0} users
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage <= 1} className="btn" style={{ fontSize: 12, padding: "6px 12px" }}>Prev</button>
            <button onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage >= (pagination.totalPages || 1)} className="btn" style={{ fontSize: 12, padding: "6px 12px" }}>Next</button>
          </div>
        </div>
      </section>
    </div>
  );
}
