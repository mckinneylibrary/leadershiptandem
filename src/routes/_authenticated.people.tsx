import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { fetchTemplates, relationLabel, type Pairing } from "@/lib/coaching";

export const Route = createFileRoute("/_authenticated/people")({
  head: () => ({ meta: [{ title: "People — Tandem" }, { name: "description", content: "Who meets with whom." }] }),
  component: People,
});

const sel = "rounded-md border border-input bg-background px-2 py-1.5 text-sm";

function People() {
  const { workspace, userId, isAdmin, members, memberName } = useWorkspace();
  const qc = useQueryClient();
  const [leader, setLeader] = useState(userId);
  const [report, setReport] = useState("");
  const [kind, setKind] = useState("reports_to");

  const pairings = useQuery({
    queryKey: ["pairings", workspace.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("pairings").select("*").eq("workspace_id", workspace.id).order("created_at");
      if (error) throw error;
      return data as Pairing[];
    },
  });
  const templates = useQuery({ queryKey: ["templates", workspace.id], queryFn: () => fetchTemplates(workspace.id) });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["pairings"] });
    qc.invalidateQueries({ queryKey: ["my-pairings"] });
  };

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("pairings").insert({
        workspace_id: workspace.id,
        leader_id: isAdmin ? leader : userId,
        report_id: report,
        kind,
        template_id: templates.data?.find((t) => t.published)?.id ?? null,
      });
      if (error) throw new Error(error.code === "23505" ? "That pairing already exists." : error.message);
    },
    onSuccess: () => {
      setReport("");
      invalidate();
      toast.success("Added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Pairing> }) => {
      const { error } = await supabase.from("pairings").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pairings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const others = members.filter((m) => m.user_id !== (isAdmin ? leader : userId));

  return (
    <div>
      <h1 className="text-3xl">People</h1>
      <p className="mt-2 text-muted-foreground">
        Set up who meets with whom. Anyone can lead, be led, or both. Invite new people from{" "}
        <Link to="/settings" className="text-primary hover:underline">Settings</Link>.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (report) add.mutate();
        }}
        className="mt-8 flex flex-wrap items-end gap-3 rounded-lg border bg-card p-5"
      >
        {isAdmin && (
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Leader</span>
            <select className={sel} value={leader} onChange={(e) => setLeader(e.target.value)}>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>{memberName(m.user_id)}</option>
              ))}
            </select>
          </label>
        )}
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">{isAdmin ? "Meets with" : "I meet with"}</span>
          <select className={sel} value={report} onChange={(e) => setReport(e.target.value)}>
            <option value="">Choose a person…</option>
            {others.map((m) => (
              <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Relationship</span>
          <select className={sel} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="reports_to">They report to the leader</option>
            <option value="partner">Coaching / mentoring partner</option>
          </select>
        </label>
        <button disabled={!report || add.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
          Add
        </button>
        {others.length === 0 && <p className="w-full text-sm text-muted-foreground">Invite someone first — you're the only one here.</p>}
      </form>

      <ul className="mt-8 divide-y rounded-lg border bg-card">
        {(pairings.data ?? []).map((p) => {
          const canEdit = isAdmin || p.leader_id === userId;
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-3 p-5 text-sm">
              <div className="min-w-48 flex-1">
                <p className="font-serif text-base">
                  {memberName(p.leader_id)} <span className="text-muted-foreground">→</span> {memberName(p.report_id)}
                </p>
                <p className="text-muted-foreground">{p.leader_id === userId || p.report_id === userId ? relationLabel(p, userId) : p.kind === "partner" ? "Coaching partner" : "Reports to"}</p>
              </div>
              {canEdit ? (
                <>
                  <select className={sel} value={p.template_id ?? ""} onChange={(e) => update.mutate({ id: p.id, patch: { template_id: e.target.value || null } })}>
                    {(templates.data ?? []).filter((t) => t.published).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select className={sel} value={p.cadence_days} onChange={(e) => update.mutate({ id: p.id, patch: { cadence_days: Number(e.target.value) } })}>
                    <option value={7}>Weekly</option>
                    <option value={14}>Every 2 weeks</option>
                    <option value={30}>Monthly</option>
                    <option value={90}>Quarterly</option>
                  </select>
                  <select
                    className={sel}
                    value=""
                    onChange={(e) => {
                      if (e.target.value && confirm("Hand this 1-on-1 and its history to a new leader?")) update.mutate({ id: p.id, patch: { leader_id: e.target.value } });
                    }}
                    title="Hand off to a new leader"
                  >
                    <option value="">Hand off…</option>
                    {members.filter((m) => m.user_id !== p.leader_id && m.user_id !== p.report_id).map((m) => (
                      <option key={m.user_id} value={m.user_id}>{m.display_name}</option>
                    ))}
                  </select>
                  <button className="text-muted-foreground hover:text-destructive" onClick={() => confirm("Remove this pairing and all its meetings?") && remove.mutate(p.id)}>
                    Remove
                  </button>
                </>
              ) : null}
              <Link to="/growth/$pairingId" params={{ pairingId: p.id }} className="text-primary hover:underline">Timeline</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
