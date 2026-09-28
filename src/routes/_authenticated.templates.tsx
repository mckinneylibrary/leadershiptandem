import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { fetchTemplates, type Template } from "@/lib/coaching";

export const Route = createFileRoute("/_authenticated/templates")({
  head: () => ({ meta: [{ title: "Templates — Tandem" }, { name: "description", content: "Question sets for your 1-on-1s." }] }),
  component: Templates,
});

const box = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Templates() {
  const { workspace, isAdmin } = useWorkspace();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const templates = useQuery({ queryKey: ["templates", workspace.id], queryFn: () => fetchTemplates(workspace.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: ["templates", workspace.id] });

  const create = useMutation({
    mutationFn: async (from?: Template) => {
      const { data, error } = await supabase
        .from("templates")
        .insert({
          workspace_id: workspace.id,
          name: from ? `${from.name} (copy)` : "New template",
          description: from?.description ?? "",
          leader_prompts: from?.leader_prompts ?? [],
          report_prompts: from?.report_prompts ?? [],
          published: false,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (id) => {
      refresh();
      setEditing(id);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("templates").delete().eq("id", id);
    },
    onSuccess: refresh,
  });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Templates</h1>
          <p className="mt-2 text-muted-foreground">
            Question sets for the leader and the other person. New meetings use the latest published version.
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => create.mutate(undefined)} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New template
          </button>
        )}
      </div>

      <div className="mt-8 space-y-4">
        {(templates.data ?? []).map((t) =>
          editing === t.id ? (
            <Editor key={t.id} t={t} onDone={() => { setEditing(null); refresh(); }} />
          ) : (
            <div key={t.id} className="rounded-lg border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg">
                    {t.name}
                    <span className={`ml-3 rounded px-1.5 py-0.5 align-middle font-sans text-xs ${t.published ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {t.published ? `Published v${t.version}` : "Draft"}
                    </span>
                  </h2>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-4 text-sm">
                    <button className="text-primary hover:underline" onClick={() => setEditing(t.id)}>Edit</button>
                    <button className="text-muted-foreground hover:text-foreground" onClick={() => create.mutate(t)}>Copy</button>
                    <button className="text-muted-foreground hover:text-destructive" onClick={() => confirm("Delete this template?") && del.mutate(t.id)}>Delete</button>
                  </div>
                )}
              </div>
              <div className="mt-4 grid gap-4 text-sm md:grid-cols-2">
                <PromptList title="Leader" items={t.leader_prompts} />
                <PromptList title="Other person" items={t.report_prompts} />
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function PromptList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5">{items.map((q, i) => <li key={i}>{q}</li>)}</ul>
    </div>
  );
}

function Editor({ t, onDone }: { t: Template; onDone: () => void }) {
  const [name, setName] = useState(t.name);
  const [description, setDescription] = useState(t.description);
  const [leader, setLeader] = useState(t.leader_prompts.join("\n"));
  const [report, setReport] = useState(t.report_prompts.join("\n"));
  const [published, setPublished] = useState(t.published);
  const split = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  async function save() {
    const { error } = await supabase
      .from("templates")
      .update({
        name,
        description,
        leader_prompts: split(leader),
        report_prompts: split(report),
        published,
        version: published && t.published ? t.version + 1 : t.version,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Saved");
    onDone();
  }

  return (
    <div className="space-y-3 rounded-lg border-2 border-primary/40 bg-card p-5">
      <input className={box} value={name} onChange={(e) => setName(e.target.value)} />
      <input className={box} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is it for?" />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Leader questions (one per line)</span>
          <textarea className={box} rows={6} value={leader} onChange={(e) => setLeader(e.target.value)} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Other person's questions (one per line)</span>
          <textarea className={box} rows={6} value={report} onChange={(e) => setReport(e.target.value)} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" className="accent-primary" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Published (available for new meetings)
      </label>
      <div className="flex gap-3">
        <button onClick={save} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save</button>
        <button onClick={onDone} className="rounded-md border border-input px-4 py-2 text-sm">Cancel</button>
      </div>
    </div>
  );
}
