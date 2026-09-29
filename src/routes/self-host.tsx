import logoMark from "@/assets/logo-mark.png";
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/self-host")({
  head: () => ({
    meta: [
      { title: "Run Tandem for your organization — Tandem" },
      { name: "description", content: "How to copy, self-host, and brand Tandem, the free open-source 1-on-1 coaching app." },
      { property: "og:title", content: "Run Tandem for your organization" },
      { property: "og:description", content: "Copy, self-host, and brand Tandem — free and open source under the MIT license." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SelfHost,
});

const paths = [
  {
    tag: "Easiest",
    title: "Use it as-is, with your brand",
    steps: [
      "Create an account and name your workspace after your organization.",
      "Open Settings → Branding. Add your name, logo link, accent color, welcome message, and a help contact.",
      "Invite your leaders from Settings → Invite people. They join the first time they sign in with that email.",
    ],
  },
  {
    tag: "Your own copy",
    title: "Copy it into your own account",
    steps: [
      "Copy (fork) the source code into your own code account, or remix the project in Lovable.",
      "Change anything you like — the MIT license lets you modify, rebrand, and redistribute it.",
      "Publish it at your own web address.",
    ],
  },
  {
    tag: "Full control",
    title: "Host it on your own servers",
    steps: [
      "Set up a database with sign-in (Supabase, hosted or on your own machine).",
      "Run the setup files in drizzle/migrations in order, then turn on email sign-in.",
      "Fill in the settings file with your database address and keys.",
      "Optional: point AI to any compatible provider, or leave it off entirely.",
      "Install, build, and deploy to any host that supports Cloudflare Workers.",
    ],
  },
];

function SelfHost() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logoMark} alt="Tandem" className="h-7 w-7 rounded-lg" />
            <span className="font-serif text-xl italic">Tandem</span>
          </Link>
          <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Make it yours</p>
        <h1 className="mt-4 font-serif text-5xl">Run Tandem for your organization.</h1>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
          Tandem is free and open source. Pick the path that fits — from a branded workspace in five minutes to a
          fully private install on your own servers.
        </p>

        <div className="mt-16 space-y-px overflow-hidden rounded-2xl border border-border bg-border">
          {paths.map((p, i) => (
            <section key={p.title} className="bg-background p-8 md:p-10">
              <div className="flex items-baseline gap-4">
                <span className="font-serif text-3xl italic text-muted-foreground">{i + 1}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">{p.tag}</p>
                  <h2 className="mt-1 font-serif text-2xl italic">{p.title}</h2>
                </div>
              </div>
              <ol className="mt-6 space-y-3 pl-10 text-sm leading-relaxed text-muted-foreground">
                {p.steps.map((s) => (
                  <li key={s} className="list-disc">{s}</li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <section className="mt-16 rounded-2xl border border-border bg-card/60 p-8">
          <h2 className="font-serif text-2xl italic">What you can brand</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <li>Product name in the header</li>
            <li>Your logo</li>
            <li>Accent color across buttons and highlights</li>
            <li>A welcome headline and message</li>
            <li>A help email or link for your people</li>
            <li>Everything else, if you run your own copy</li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            Detailed technical steps are in the SELF_HOSTING.md and BRANDING.md guides included with the source code.
          </p>
        </section>
      </main>
    </div>
  );
}
