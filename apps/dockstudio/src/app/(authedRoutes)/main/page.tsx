"use client";

// Force dynamic rendering — this page is user-specific and must never be
// statically prerendered (doing so causes stale chunk hashes on rebuild → CSS/JS 404s).
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Loader2, Trash2, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/lib/api";
import { PromptModal, ConfirmModal, NewProjectModal } from "@/components/Modal";

type Project = {
  id: string;
  name: string;
  description: string | null;
  templateType: string;
  status: string;
  createdAt: string;
};

export default function MainPage() {
  const { user } = useUser();
  const api = useApi();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Modal state
  const [showNewProject, setShowNewProject] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const load = async () => {
      try {
        // Best-effort sync — never block project list if this fails
        await api.post("/api/users/sync", {
          clerk_id: user.id,
          email: user.primaryEmailAddress?.emailAddress ?? "",
          name: user.fullName ?? user.firstName ?? "",
          avatar: user.imageUrl ?? "",
        }).catch(() => {});

        const p: Project[] = await api.get("/api/projects/");
        if (!cancelled) setProjects(p ?? []);
      } catch {
        // API unreachable — show empty state, don't crash
        if (!cancelled) setProjects([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const createProject = async (data: { name: string; description: string }) => {
    setCreating(true);
    try {
      const p = await api.post("/api/projects/", {
        name: data.name,
        description: data.description || undefined,
      });
      setProjects((prev) => [p, ...prev]);
      router.push(`/project/${p.id}`);
    } catch (e) {
      console.error("Failed to create project", e);
    } finally {
      setCreating(false);
    }
  };

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTarget(id);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.del(`/api/projects/${deleteTarget}`);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget));
    } catch (err) {
      console.error("Failed to delete project", err);
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header — DraftDock editorial style */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <Cpu size={13} />
          <span className="uppercase text-[10px] tracking-widest font-medium">DockStudio · DraftDock</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <h1 className="font-headline text-5xl font-bold tracking-tighter text-foreground">
            My Projects
          </h1>
          <Button
            className="gap-2 bg-card text-foreground hover:bg-muted font-headline font-semibold active:scale-95 transition-all w-fit border border-border"
            onClick={() => setShowNewProject(true)}
            disabled={creating}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            New Project
          </Button>
        </div>
        <p className="text-muted-foreground mt-2 tracking-tight">
          {user?.firstName
            ? `Welcome back, ${user.firstName}.`
            : "Welcome back."}{" "}
          Create a new project or continue where you left off.
        </p>
      </header>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Project grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create new card */}
          <Card
            className="border-dashed border-2 border-border bg-transparent hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => setShowNewProject(true)}
          >
            <CardHeader className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 rounded-md bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-600/20 transition-colors">
                <Plus className="w-5 h-5 text-violet-400" />
              </div>
              <CardTitle className="text-foreground font-headline text-base font-semibold">
                New Project
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground text-[13px] mt-1">
                Start with a prompt and let AI build your app
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Existing projects */}
          {projects.map((p) => (
            <Card
              key={p.id}
              className="border border-border bg-card hover:bg-muted/50 transition-colors cursor-pointer group relative"
              onClick={() => router.push(`/project/${p.id}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-foreground font-headline text-base font-semibold">
                    {p.name}
                  </CardTitle>
                  <button
                    onClick={(e) => deleteProject(p.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-500/15 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                <CardDescription className="text-muted-foreground text-[13px]">
                  {p.description ?? "No description"}
                </CardDescription>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 font-medium">
                    {p.templateType}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-center">
          <FolderOpen className="w-14 h-14 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-base">
            No projects yet. Click &quot;New Project&quot; to start building.
          </p>
        </div>
      )}

      {/* ── Modals ──────────────────────────── */}
      <NewProjectModal
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={createProject}
        loading={creating}
      />

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        description="This action cannot be undone. All tasks and files in this project will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
