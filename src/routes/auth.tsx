import logoMark from "@/assets/logo-mark.png";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Tandem" },
      { name: "description", content: "Sign in or create a free Tandem account." },
      { property: "og:title", content: "Sign in — Tandem" },
      { property: "og:description", content: "Sign in or create a free Tandem account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/home" });
  }, [user, navigate]);

  // An invitation link carries the invited address: prefill it and open the sign-up form.
  useEffect(() => {
    const invited = new URLSearchParams(window.location.search).get("email");
    if (invited) {
      setEmail(invited);
      setMode("signup");
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMsg(error.message);
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/home`, data: { full_name: name } },
      });
      if (error) setMsg(error.message);
      else if (!data.session) setMsg("Check your email to confirm your account, then sign in.");
    }
    setBusy(false);
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (result.error) setMsg("Google sign-in didn't work. Please try again.");
  }

  const field =
    "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-accent";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-full -translate-x-1/2"
        style={{ background: "radial-gradient(circle at 50% 0%, color-mix(in oklab, var(--accent) 6%, transparent), transparent 70%)" }}
      />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img src={logoMark} alt="Tandem" className="h-8 w-8 rounded-lg" />
            <span className="font-serif text-xl italic">Tandem</span>
          </Link>
          <h1 className="mt-8 font-serif text-4xl text-foreground">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to your coaching space." : "Free forever. Open source. Yours to keep."}
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card/40 p-8 backdrop-blur-sm">
          <form onSubmit={submit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Your name
                </label>
                <input className={field} placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Email
              </label>
              <input className={field} type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              <input className={field} type="password" placeholder="••••••••" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <button
              disabled={busy}
              className="w-full rounded-xl bg-primary py-4 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>

            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-border" />
              <span className="absolute bg-card px-4 text-[10px] uppercase tracking-widest text-muted-foreground/70">
                or continue with
              </span>
            </div>

            <button
              type="button"
              onClick={google}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-transparent py-4 font-medium text-foreground/80 transition-all hover:bg-secondary"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button className="font-medium text-accent hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
