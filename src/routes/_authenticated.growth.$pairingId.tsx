import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/lib/workspace";
import { fmtDate } from "@/lib/coaching";

export const Route = createFileRoute("/_authenticated/growth/$pairingId")({
  head: () => ({ meta: [{ title: "Growth timeline — Tandem" }, { name: "description", content: "Conversations over time." }] }),
  component: Growth,
});

function Growth() {
  const { pairingId } = Route.useParams();
  const { memberName } = useWorkspace();

  const data = useQuery({
    queryKey: ["growth", pairingId],
    queryFn: async () => {
      const { data: pairing } = await supabase.from("pairings").select("*").eq("id", pairingId).single();
      const { data: meetings } = await supabase.from("meetings").select("*").eq("pairing_id", pairingId).order("held_on", { ascending: false });
      const ids = (meetings ?? []).map((m) => m.id);
      const [{ data: notes }, { data: actions }] = await Promise.all([
        supabase.from("meeting_notes").select("*").in("meeting_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]).eq("visibility", "shared"),
        supabase.from("action_items").select("*").eq("pairing_id", pairingId).not("done_at", "is", null),
      ]);
      return { pairing, meetings: meetings ?? [], notes: notes ?? [], actions: actions ?? [] };
    },
  });

  if (data.isLoading) return <p className="text-muted-foreground">Loading…</p>;
  const d = data.data;
  if (!d?.pairing) return <p className="text-muted-foreground">This timeline isn't available to you.</p>;
  const title = `${memberName(d.pairing.leader_id)} & ${memberName(d.pairing.report_id)}`;

  function exportMd() {
    const lines = [`# 1-on-1 timeline: ${title}`, ""];
    for (const m of d!.meetings) {
      lines.push(`## ${fmtDate(m.held_on)}${m.template_name ? ` — ${m.template_name}` : ""}`, "");
      if (m.ai_summary) lines.push("### Summary", m.ai_summary, "");
      for (const n of d!.notes.filter((x) => x.meeting_id === m.id && x.body.trim())) lines.push(`### Notes from ${memberName(n.author_id)}`, n.body, "");
      const done = d!.actions.filter((a) => a.meeting_id === m.id);
      if (done.length) lines.push("### Completed", ...done.map((a) => `- ${a.body}`), "");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tandem-timeline-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/home" className="text-sm text-muted-foreground hover:text-foreground">← All 1-on-1s</Link>
          <h1 className="mt-2 text-3xl">{title}</h1>
          <p className="mt-1 text-muted-foreground">{d.meetings.length} conversations · {d.actions.length} action items completed</p>
        </div>
        <button onClick={exportMd} className="rounded-md border border-input bg-card px-4 py-2 text-sm font-medium">Export</button>
      </div>

      <ol className="mt-10 space-y-8 border-l pl-8">
        {d.meetings.map((m) => (
          <li key={m.id} className="relative">
            <span className="absolute -left-[37px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
            <Link to="/meetings/$id" params={{ id: m.id }} className="font-serif text-lg hover:underline">
              {fmtDate(m.held_on)}
            </Link>
            {m.template_name && <span className="ml-2 text-sm text-muted-foreground">{m.template_name}</span>}
            {m.ai_summary ? (
              <p className="mt-2 whitespace-pre-wrap text-sm">{m.ai_summary}</p>
            ) : (
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {d.notes.find((n) => n.meeting_id === m.id && n.body.trim())?.body ?? "No shared notes."}
              </p>
            )}
          </li>
        ))}
        {!d.meetings.length && <li className="text-muted-foreground">No meetings yet.</li>}
      </ol>
    </div>
  );
}
