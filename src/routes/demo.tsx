import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Sparkles } from "lucide-react";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Try Tandem — a live demo 1-on-1, no sign-in" },
      { name: "description", content: "Explore a sample 1-on-1 in Tandem: shared agenda, coaching questions, private notes and action items. No account needed." },
      { property: "og:title", content: "Try a Tandem 1-on-1 — no sign-in" },
      { property: "og:description", content: "Click around a sample coaching 1-on-1. Nothing is saved." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

type Who = "Jordan" | "Priya";
const box = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

const leaderPrompts = [
  "What's one thing I could do differently to support you better?",
  "Where are you feeling stretched right now?",
  "What have you learned since we last talked?",
  "What's a decision you'd like more ownership of?",
  "How are you taking care of your energy this week?",
];
const reportPrompts = [
  "What's a win from the last two weeks you're proud of?",
  "What's getting in your way?",
  "What skill do you want to grow next?",
  "What feedback do you have for me?",
  "What would make next week a great week?",
];

const history = [
  { date: "Sep 14", title: "Coaching check-in", done: true },
  { date: "Aug 31", title: "Career growth", done: true },
  { date: "Aug 17", title: "Coaching check-in", done: true },
];

function Demo() {
  const [agenda, setAgenda] = useState([
    { body: "Launch retro — what went well, what didn't", by: "Priya" as Who, done: true },
    { body: "Taking the lead on the Q4 planning session", by: "Priya" as Who, done: false },
    { body: "Workload check: two projects overlapping in October", by: "Jordan" as Who, done: false },
  ]);
  const [actions, setActions] = useState([
    { body: "Draft the Q4 planning agenda and share by Friday", owner: "Priya" as Who, due: "Oct 2", done: false, carried: false },
    { body: "Introduce Priya to the operations lead", owner: "Jordan" as Who, due: "Sep 30", done: false, carried: false },
    { body: "Book a facilitation workshop seat", owner: "Priya" as Who, due: "Sep 25", done: true, carried: true },
  ]);
  const [newAgenda, setNewAgenda] = useState("");
  const [newAction, setNewAction] = useState("");
  const [owner, setOwner] = useState<Who>("Priya");
  const [shared, setShared] = useState(
    "Launch landed on time — Priya handled the stakeholder updates really well.\n\nWants to run Q4 planning end-to-end. Agreed: she leads, I'll be a sounding board.",
  );
  const [priv, setPriv] = useState("Seems a bit stretched. Watch for overload in October — consider moving the reporting project.");
  const [showSummary, setShowSummary] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-primary/30 bg-primary/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3 text-sm">
          <span>
            <strong className="font-medium">Demo mode</strong>
            <span className="text-muted-foreground"> — sample data, click anything. Nothing is saved.</span>
          </span>
          <Link to="/auth" className="rounded-full bg-foreground px-4 py-1.5 font-medium text-background hover:bg-foreground/90">
            Start your own — free
          </Link>
        </div>
      </div>

      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 font-serif text-xl italic">
            <span className="text-primary">◆</span> Tandem
          </Link>
          <span className="text-sm text-muted-foreground">Signed in as Jordan (demo)</span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-10 lg:grid-cols-[1fr_220px]">
        <div className="space-y-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Jordan ↔ Priya · every 2 weeks</p>
            <h1 className="mt-2 text-4xl">Coaching check-in</h1>
            <p className="mt-2 text-sm text-muted-foreground">Monday, Sep 28 · 30 min</p>
          </div>

          <section>
            <h2 className="text-xl">Agenda</h2>
            <ul className="mt-3 space-y-2">
              {agenda.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 accent-primary" checked={a.done}
                    onChange={(e) => setAgenda((xs) => xs.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} />
                  <span className={a.done ? "text-muted-foreground line-through" : ""}>{a.body}</span>
                  <span className="text-xs text-muted-foreground">— {a.by}</span>
                </li>
              ))}
            </ul>
            <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newAgenda.trim()) { setAgenda((xs) => [...xs, { body: newAgenda.trim(), by: "Jordan", done: false }]); setNewAgenda(""); } }}>
              <input className={box} value={newAgenda} onChange={(e) => setNewAgenda(e.target.value)} placeholder="Add a topic…" />
              <button className="rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Add</button>
            </form>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <Prompts title="Questions for you (leader)" items={leaderPrompts} />
            <Prompts title="Questions for Priya" items={reportPrompts} />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium">Your shared notes</h3>
                <span className="text-xs text-muted-foreground">Visible to Priya</span>
              </div>
              <textarea rows={8} value={shared} onChange={(e) => setShared(e.target.value)} className={`${box} mt-2 font-serif leading-relaxed`} />
            </div>
            <div>
              <h3 className="text-sm font-medium">Priya's shared notes</h3>
              <div className="mt-2 min-h-32 whitespace-pre-wrap rounded-md border bg-muted/50 p-3 font-serif text-sm leading-relaxed">
                {"Proud of the launch comms.\n\nWould love feedback on how I run the planning session — maybe sit in on the first half?"}
              </div>
            </div>
            <div className="md:col-span-2">
              <div className="flex items-baseline justify-between">
                <h3 className="flex items-center gap-1.5 text-sm font-medium"><Lock className="h-3.5 w-3.5" /> Private notes</h3>
                <span className="text-xs text-muted-foreground">Only you can see these — never sent to AI</span>
              </div>
              <textarea rows={3} value={priv} onChange={(e) => setPriv(e.target.value)} className={`${box} mt-2 bg-highlight/5 font-serif leading-relaxed`} />
            </div>
          </section>

          <section>
            <h2 className="text-xl">Action items</h2>
            <ul className="mt-3 space-y-2">
              {actions.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <input type="checkbox" className="mt-1 accent-primary" checked={a.done}
                    onChange={(e) => setActions((xs) => xs.map((x, j) => (j === i ? { ...x, done: e.target.checked } : x)))} />
                  <span className={a.done ? "text-muted-foreground line-through" : ""}>{a.body}</span>
                  <span className="text-xs text-muted-foreground">— {a.owner}{a.due && `, due ${a.due}`}{a.carried && " · carried over"}</span>
                </li>
              ))}
            </ul>
            <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (newAction.trim()) { setActions((xs) => [...xs, { body: newAction.trim(), owner, due: "", done: false, carried: false }]); setNewAction(""); } }}>
              <input className={`${box} min-w-60 flex-1`} value={newAction} onChange={(e) => setNewAction(e.target.value)} placeholder="Add an action item…" />
              <select className="rounded-md border border-input bg-background px-2 text-sm" value={owner} onChange={(e) => setOwner(e.target.value as Who)}>
                <option>Priya</option>
                <option>Jordan</option>
              </select>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add</button>
            </form>
          </section>

          <section className="rounded-lg border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl">Summary</h2>
              <button onClick={() => setShowSummary(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                <Sparkles className="h-4 w-4" /> {showSummary ? "Rewrite summary" : "Summarize with AI"}
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Uses the agenda and shared notes only. Private notes are never sent. AI is optional.</p>
            {showSummary ? (
              <div className="mt-4 space-y-2 text-sm">
                <p>Priya delivered the launch on time and handled stakeholder communication well.</p>
                <p>She'll lead Q4 planning end-to-end, with Jordan as a sounding board and sitting in on the first half for feedback.</p>
                <p>Open item: October workload overlap to revisit next time.</p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No summary yet. (In the demo this shows a sample.)</p>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">Past 1-on-1s</h2>
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.date} className="rounded-lg border bg-card p-3 text-sm">
                <p className="font-medium">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.date} · done</p>
              </li>
            ))}
          </ul>
          <div className="rounded-lg border border-primary/30 p-4 text-sm">
            <p className="font-serif text-lg italic">Like it?</p>
            <p className="mt-1 text-muted-foreground">Set up your own team in about a minute.</p>
            <Link to="/auth" className="mt-3 inline-block font-medium text-primary hover:underline">Create a free account →</Link>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Prompts({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <h3 className="text-sm font-medium">{title}</h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 font-serif">
        {items.map((q, i) => <li key={i}>{q}</li>)}
      </ol>
    </div>
  );
}
