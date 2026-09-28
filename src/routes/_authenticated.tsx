import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { FullPageMessage, WorkspaceProvider, useWorkspace } from "@/lib/workspace";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthedLayout,
});

function AuthedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);
  if (loading || !user) return <FullPageMessage text="Opening your notebook…" />;
  return (
    <WorkspaceProvider userId={user.id}>
      <Shell />
    </WorkspaceProvider>
  );
}

const links = [
  { to: "/home", label: "1-on-1s" },
  { to: "/people", label: "People" },
  { to: "/templates", label: "Templates" },
  { to: "/settings", label: "Settings" },
] as const;

function useAccent(color: string | null) {
  useEffect(() => {
    const root = document.documentElement;
    const vars = ["--primary", "--accent", "--highlight", "--ring"];
    if (color) vars.forEach((v) => root.style.setProperty(v, color));
    return () => vars.forEach((v) => root.style.removeProperty(v));
  }, [color]);
}

function Shell() {
  const { workspace, workspaces, switchWorkspace } = useWorkspace();
  useAccent(workspace.accent_color);
  const brand = workspace.brand_name?.trim() || "Tandem";
  const support = workspace.support_contact?.trim();
  const supportHref = support ? (support.includes("@") && !support.startsWith("http") ? `mailto:${support}` : support) : null;
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-4">
          <Link to="/home" className="flex items-center gap-2.5">
            {workspace.logo_url ? (
              <img src={workspace.logo_url} alt="" className="h-7 w-7 rounded-lg object-contain" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
                <div className="h-3.5 w-3.5 rotate-45 border-2 border-background" />
              </div>
            )}
            <span className="font-serif text-xl italic">{brand}</span>
          </Link>
          {workspaces.length > 1 ? (
            <select
              value={workspace.id}
              onChange={(e) => switchWorkspace(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-muted-foreground">{workspace.name}</span>
          )}
          <nav className="ml-auto flex flex-wrap items-center gap-4 text-sm">
            {links.map((l) => (
              <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
                {l.label}
              </Link>
            ))}
            <button onClick={() => supabase.auth.signOut()} className="text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
      {(supportHref || workspace.brand_name) && (
        <footer className="mx-auto flex max-w-5xl flex-wrap justify-between gap-2 border-t border-border px-6 py-6 text-xs text-muted-foreground">
          <span>{workspace.brand_name ? "Powered by Tandem · open source" : ""}</span>
          {supportHref && (
            <a href={supportHref} target="_blank" rel="noreferrer" className="hover:text-foreground">
              Need help? {support}
            </a>
          )}
        </footer>
      )}
    </div>
  );
}
