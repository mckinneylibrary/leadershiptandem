import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Lock, MessagesSquare, Sparkles, TrendingUp, ListChecks } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tandem — free, open-source 1-on-1 coaching for every leader" },
      {
        name: "description",
        content:
          "Shared agendas, private notes, action items that follow through, and optional AI summaries. MIT-licensed and self-hostable.",
      },
      { property: "og:title", content: "Tandem — open-source 1-on-1 coaching" },
      {
        property: "og:description",
        content: "Better 1-on-1s for team leads, managers, executives, coordinators and captains. Free and open source.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: MessagesSquare,
    title: "Shared agenda",
    body: "Both people add topics before you meet, so nothing important waits for next time.",
  },
  {
    icon: CalendarCheck,
    title: "Prompts that fit",
    body: "Weekly check-ins, career growth, first 90 days, skip-levels — or write your own.",
  },
  {
    icon: Lock,
    title: "Private when it matters",
    body: "Shared notes for both of you. Private notes only the leader can see.",
  },
  {
    icon: ListChecks,
    title: "Follow-through",
    body: "Action items carry from meeting to meeting until someone checks them off.",
  },
  {
    icon: TrendingUp,
    title: "A growth timeline",
    body: "Look back over months of conversations and export them for reviews or reflection.",
  },
  {
    icon: Sparkles,
    title: "AI, if you want it",
    body: "Optional summaries and action-item suggestions. Turn it off and everything still works.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <div className="h-4 w-4 rotate-45 border-2 border-background" />
          </div>
          <span className="font-serif text-xl italic">Tandem</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
        >
          Sign in
        </Link>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-20 pt-24 md:pt-32">
          <div
            className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-full -translate-x-1/2"
            style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 8%, transparent), transparent 70%)" }}
          />
          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs font-medium text-accent">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>
              Free · Open source · MIT
            </div>

            <h1 className="text-5xl leading-[0.95] tracking-tight text-foreground md:text-7xl">
              The conversation that makes people better,{" "}
              <span className="italic text-accent">kept in one quiet place.</span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Tandem helps leaders at every level — team leads, managers, executives, nonprofit coordinators, volunteer
              captains — run 1-on-1s that actually lead somewhere.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/auth"
                className="w-full rounded-full bg-foreground px-8 py-4 font-semibold text-background transition-all duration-300 hover:bg-foreground/90 sm:w-auto"
              >
                Start your first 1-on-1
              </Link>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-full border border-border bg-transparent px-8 py-4 font-medium text-foreground/80 transition-all hover:bg-secondary sm:w-auto"
              >
                View the source
              </a>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <div key={title} className="group bg-background p-10 transition-colors hover:bg-secondary/50">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
                </div>
                <h2 className="mb-3 font-serif text-xl italic text-foreground">{title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Open source */}
        <section className="mx-auto max-w-6xl border-t border-border px-6 py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Yours to keep</p>
            <h2 className="font-serif text-4xl text-foreground">Free as in freedom, not as in trial.</h2>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Tandem is released under the MIT license. Use the hosted version, or run it on your own servers with your
              own AI provider. Your notes belong to you and the person you're meeting with — not to HR, and not to us.
            </p>
            <Link to="/self-host" className="mt-8 inline-block font-medium text-accent hover:underline">
              Run it for your organization →
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-12 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <div className="h-4 w-4 rotate-45 border-2 border-background" />
            </div>
            <span className="font-serif text-lg italic text-foreground">Tandem</span>
          </div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Open-source 1-on-1 coaching
          </p>
          <p className="text-xs text-muted-foreground/60">Released under the MIT License.</p>
        </div>
      </footer>
    </div>
  );
}
