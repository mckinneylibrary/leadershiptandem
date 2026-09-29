import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { asList, fmtDate, type Pairing } from "@/lib/coaching";
import { suggestActionItems, summarizeMeeting } from "@/lib/ai.functions";
import { AddToCalendar } from "@/components/AddToCalendar";
import { nextSlot } from "@/lib/calendar";

export const Route = createFileRoute("/_authenticated/meetings/$id")({
  head: () => ({ meta: [{ title: "1-on-1 — Tandem" }, { name: "description", content: "Agenda, notes and action items." }] }),
  component: MeetingPage,
});

const box = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function MeetingPage() {
  const { id } = Route.useParams();
  const { userId, memberName, workspace } = useWorkspace();
  const qc = useQueryClient();

  const meeting = useQuery({
    queryKey: ["meeting", id], refetchInterval: 5000,
    queryFn: async () => {
      const { data, error } = await supabase.from("meetings").select("*").eq("id", id).single();
      if (error) throw error;
      const { data: p } = await supabase.from("pairings").select("*").eq("id", data.pairing_id).single();
      return { ...data, pairing: p as Pairing };
    },
  });
  const agenda = useQuery({
    queryKey: ["agenda", id], refetchInterval: 5000,
    queryFn: async () => (await supabase.from("agenda_items").select("*").eq("meeting_id", id).order("created_at")).data ?? [],
  });
  const notes = useQuery({
    queryKey: ["notes", id], refetchInterval: 5000,
    queryFn: async () => (await supabase.from("meeting_notes").select("*").eq("meeting_id", id)).data ?? [],
  });
  const pairingId = meeting.data?.pairing_id;
  const actions = useQuery({
    queryKey: ["actions", pairingId, id], refetchInterval: 5000,
    enabled: !!pairingId,
    queryFn: async () =>
      (await supabase.from("action_items").select("*").eq("pairing_id", pairingId!).or(`done_at.is.null,meeting_id.eq.${id}`).order("created_at")).data ?? [],
  });

  const [newAgenda, setNewAgenda] = useState("");
  const [newAction, setNewAction] = useState("");
  const [actionOwner, setActionOwner] = useState("");
  const [due, setDue] = useState("");
  const [suggestions, setSuggestions] = useState<{ body: string; owner: "leader" | "report" }[]>([]);

  const summarize = useServerFn(summarizeMeeting);
  const suggest = useServerFn(suggestActionItems);

  const m = meeting.data;
  const p = m?.pairing;
  const isParty = !!p && (p.leader_id === userId || p.report_id === userId);
  const isLeader = p?.leader_id === userId;
  const otherId = p ? (isLeader ? p.report_id : p.leader_id) : "";

  const addAgenda = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agenda_items").insert({ meeting_id: id, author_id: userId, body: newAgenda.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewAgenda("");
      qc.invalidateQueries({ queryKey: ["agenda", id] });
    },
  });
  const toggleAgenda = useMutation({
    mutationFn: async ({ itemId, done }: { itemId: string; done: boolean }) => {
      await supabase.from("agenda_items").update({ done }).eq("id", itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agenda", id] }),
  });
  const addAction = useMutation({
    mutationFn: async (item: { body: string; owner_id: string; due_date?: string | null }) => {
      const { error } = await supabase.from("action_items").insert({
        pairing_id: p!.id,
        meeting_id: id,
        created_by: userId,
        body: item.body,
        owner_id: item.owner_id,
        due_date: item.due_date || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewAction("");
      setDue("");
      qc.invalidateQueries({ queryKey: ["actions"] });
      qc.invalidateQueries({ queryKey: ["open-actions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleAction = useMutation({
    mutationFn: async ({ itemId, done }: { itemId: string; done: boolean }) => {
      await supabase.from("action_items").update({ done_at: done ? new Date().toISOString() : null, ...(done ? { meeting_id: id } : {}) }).eq("id", itemId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["actions"] }),
  });
  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      await supabase.from("meetings").update({ status }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting", id] }),
  });
  const navigate = useNavigate();
  const deleteMeeting = useMutation({
    mutationFn: async () => {
      // Agenda items and notes are removed automatically with the meeting;
      // action items are kept and simply detached from it.
      const { error } = await supabase.from("meetings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      toast("1-on-1 deleted.");
      navigate({ to: "/home" });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const runSummary = useMutation({
    mutationFn: () => summarize({ data: { meetingId: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meeting", id] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const runSuggest = useMutation({
    mutationFn: () => suggest({ data: { meetingId: id } }),
    onSuccess: (r) => {
      setSuggestions(r.items);
      if (!r.items.length) toast("No new action items found.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (meeting.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!m || !p) return <p className="text-muted-foreground">This meeting isn't available to you.</p>;

  const myShared = notes.data?.find((n) => n.author_id === userId && n.visibility === "shared");
  const myPrivate = notes.data?.find((n) => n.author_id === userId && n.visibility === "private");
  const theirShared = notes.data?.filter((n) => n.author_id !== userId && n.visibility === "shared") ?? [];

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/home" className="text-sm text-muted-foreground hover:text-foreground">← All 1-on-1s</Link>
          <h1 className="mt-2 text-3xl">
            {memberName(p.leader_id)} &amp; {memberName(p.report_id)}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {fmtDate(m.held_on)}
            {m.template_name && ` · ${m.template_name}`}
            {!isParty && " · view only"}
          </p>
        </div>
        {isParty && (
          <div className="flex items-center gap-4">
            <AddToCalendar
              label="Add to calendar"
              title={`1-on-1: ${memberName(p.leader_id)} & ${memberName(p.report_id)}`}
              description={`Agenda and notes live in ${workspace.brand_name || "Tandem"}: ${typeof window !== "undefined" ? window.location.href : ""}`}
              start={nextSlot(m.held_on, p.cadence_days)}
              repeatEveryDays={p.cadence_days}
              allowRepeat
            />
            <button
              onClick={() => setStatus.mutate(m.status === "done" ? "open" : "done")}
              className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium"
            >
              {m.status === "done" ? "Reopen" : "Mark as done"}
            </button>
            <button
              onClick={() => {
                if (window.confirm("Delete this 1-on-1 and all its notes and agenda items? Action items are kept. This can't be undone.")) deleteMeeting.mutate();
              }}
              disabled={deleteMeeting.isPending}
              className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium text-destructive"
            >
              {deleteMeeting.isPending ? "Deleting…" : "Delete"}
            </button>
          </div>
        )}
      </div>

      <section>
        <h2 className="text-xl">Agenda</h2>
        <ul className="mt-3 space-y-2">
          {(agenda.data ?? []).map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 accent-primary" checked={a.done} disabled={!isParty} onChange={(e) => toggleAgenda.mutate({ itemId: a.id, done: e.target.checked })} />
              <span className={a.done ? "text-muted-foreground line-through" : ""}>{a.body}</span>
              <span className="text-xs text-muted-foreground">— {memberName(a.author_id)}</span>
            </li>
          ))}
          {!agenda.data?.length && <li className="text-sm text-muted-foreground">No topics yet. Either of you can add one.</li>}
        </ul>
        {isParty && (
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newAgenda.trim()) addAgenda.mutate(); }}>
            <input className={box} value={newAgenda} onChange={(e) => setNewAgenda(e.target.value)} placeholder="Add a topic…" />
            <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Add</button>
          </form>
        )}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Prompts title={`Questions for ${memberName(p.leader_id) === "You" ? "you (leader)" : memberName(p.leader_id)}`} items={asList(m.leader_prompts)} />
        <Prompts title={`Questions for ${memberName(p.report_id) === "You" ? "you" : memberName(p.report_id)}`} items={asList(m.report_prompts)} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {isParty && (
          <NoteEditor key={`s-${myShared?.id ?? "new"}`} label="Your shared notes" hint={`Visible to ${memberName(otherId)}`} meetingId={id} userId={userId} visibility="shared" initial={myShared?.body ?? ""} />
        )}
        {theirShared.map((n) => (
          <div key={n.id}>
            <h3 className="text-sm font-medium">{memberName(n.author_id)}'s shared notes</h3>
            <div className="mt-2 min-h-32 whitespace-pre-wrap rounded-md border bg-muted/50 p-3 text-sm">{n.body || <span className="text-muted-foreground">Nothing yet.</span>}</div>
          </div>
        ))}
        {(
          <NoteEditor key={`p-${myPrivate?.id ?? "new"}`} label="Private notes" hint="Only you can see these" meetingId={id} userId={userId} visibility="private" initial={myPrivate?.body ?? ""} />
        )}
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl">Action items</h2>
          {isParty && workspace.ai_enabled && (
            <button onClick={() => runSuggest.mutate()} disabled={runSuggest.isPending} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
              {runSuggest.isPending ? "Thinking…" : "Suggest from notes"}
            </button>
          )}
        </div>
        <ul className="mt-3 space-y-2">
          {(actions.data ?? []).map((a) => (
            <li key={a.id} className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1 accent-primary" checked={!!a.done_at} disabled={!isParty} onChange={(e) => toggleAction.mutate({ itemId: a.id, done: e.target.checked })} />
              <span className={a.done_at ? "text-muted-foreground line-through" : ""}>{a.body}</span>
              <span className="text-xs text-muted-foreground">
                — {memberName(a.owner_id)}
                {a.due_date && `, due ${fmtDate(a.due_date)}`}
                {a.meeting_id !== id && " · carried over"}
              </span>
            </li>
          ))}
          {!actions.data?.length && <li className="text-sm text-muted-foreground">No action items.</li>}
        </ul>
        {suggestions.length > 0 && (
          <div className="mt-4 rounded-md border border-dashed bg-accent/40 p-4">
            <p className="text-sm font-medium">Suggestions</p>
            <ul className="mt-2 space-y-2">
              {suggestions.map((s, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="flex-1">{s.body} <span className="text-xs text-muted-foreground">— {memberName(s.owner === "leader" ? p.leader_id : p.report_id)}</span></span>
                  <button
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      addAction.mutate({ body: s.body, owner_id: s.owner === "leader" ? p.leader_id : p.report_id });
                      setSuggestions((xs) => xs.filter((_, j) => j !== i));
                    }}
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isParty && (
          <form
            className="mt-3 flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (newAction.trim()) addAction.mutate({ body: newAction.trim(), owner_id: actionOwner || otherId, due_date: due });
            }}
          >
            <input className={`${box} min-w-60 flex-1`} value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Add an action item…" />
            <select className="rounded-md border border-input bg-background px-2 text-sm" value={actionOwner || otherId} onChange={(e) => setActionOwner(e.target.value)}>
              <option value={p.leader_id}>{memberName(p.leader_id)}</option>
              <option value={p.report_id}>{memberName(p.report_id)}</option>
            </select>
            <input type="date" className="rounded-md border border-input bg-background px-2 text-sm" value={due} onChange={(e) => setDue(e.target.value)} />
            <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add</button>
          </form>
        )}
      </section>

      {workspace.ai_enabled && (
        <section className="rounded-lg border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl">Summary</h2>
            {isParty && (
              <button onClick={() => runSummary.mutate()} disabled={runSummary.isPending} className="text-sm font-medium text-primary hover:underline disabled:opacity-50">
                {runSummary.isPending ? "Writing…" : m.ai_summary ? "Rewrite summary" : "Summarize with AI"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Uses the agenda and shared notes only. Private notes are never sent.</p>
          {m.ai_summary ? <div className="mt-4 whitespace-pre-wrap text-sm">{m.ai_summary}</div> : <p className="mt-4 text-sm text-muted-foreground">No summary yet.</p>}
        </section>
      )}
    </div>
  );
}

function Prompts({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      {items.length ? (
        <ol className="mt-3 list-decimal space-y-2 pl-5 font-serif">
          {items.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No prompts.</p>
      )}
    </div>
  );
}

function NoteEditor(props: { label: string; hint: string; meetingId: string; userId: string; visibility: "shared" | "private"; initial: string }) {
  const [value, setValue] = useState(props.initial);
  const [saved, setSaved] = useState(props.initial);
  const qc = useQueryClient();

  useEffect(() => {
    if (value === saved) return;
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from("meeting_notes")
        .upsert(
          { meeting_id: props.meetingId, author_id: props.userId, visibility: props.visibility, body: value, updated_at: new Date().toISOString() },
          { onConflict: "meeting_id,author_id,visibility" },
        );
      if (error) toast.error("Couldn't save notes");
      else {
        setSaved(value);
        qc.invalidateQueries({ queryKey: ["notes", props.meetingId] });
      }
    }, 800);
    return () => clearTimeout(t);
  }, [value, saved, props, qc]);

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium">{props.label}</h3>
        <span className="text-xs text-muted-foreground">{value === saved ? props.hint : "Saving…"}</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        className={`${box} mt-2 font-serif leading-relaxed ${props.visibility === "private" ? "bg-highlight/5" : ""}`}
        placeholder="Write as you talk…"
      />
    </div>
  );
}
