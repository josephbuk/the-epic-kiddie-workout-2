import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { completeAssignment } from "@/lib/api.functions";
import { flushCompletionQueue } from "@/lib/offline-cache";
import { validatePasscode } from "@/lib/passcode";

type Mode = "kids" | "gups";

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const complete = useServerFn(completeAssignment);
  const [parentId, setParentId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("kids");
  const [gateOpen, setGateOpen] = useState(false);
  const [gateMode, setGateMode] = useState<"enter" | "set">("enter");
  const [entered, setEntered] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const flush = () => flushCompletionQueue((id) => complete({ data: { id } }));
    flush();
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [complete]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setParentId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem("kgm_mode");
    if (saved === "gups" || saved === "kids") setMode(saved);
  }, []);

  const passKey = parentId ? `kgm_passcode_${parentId}` : null;
  const isKidMode = pathname.startsWith("/play/") && pathname !== "/play";

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    sessionStorage.removeItem("kgm_mode");
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  function switchTo(next: Mode) {
    if (next === mode) return;
    if (next === "kids") {
      setMode("kids");
      sessionStorage.setItem("kgm_mode", "kids");
      navigate({ to: "/play" });
      return;
    }
    if (!passKey) return;
    const existing = localStorage.getItem(passKey);
    setGateMode(existing ? "enter" : "set");
    setEntered("");
    setConfirmPass("");
    setError(null);
    setGateOpen(true);
  }

  function submitGate(e: React.FormEvent) {
    e.preventDefault();
    if (!passKey) return;
    if (gateMode === "set") {
      const v = validatePasscode(entered);
      if (v) return setError(v);
      if (entered !== confirmPass) return setError("Passcodes don't match");
      localStorage.setItem(passKey, entered);
    } else {
      const stored = localStorage.getItem(passKey);
      if (entered !== stored) return setError("Wrong passcode");
    }
    setMode("gups");
    sessionStorage.setItem("kgm_mode", "gups");
    setGateOpen(false);
    navigate({ to: "/dashboard" });
  }

  if (isKidMode) {
    return <div className="min-h-screen bg-background text-foreground">{children}</div>;
  }

  const gupsNav = [
    { to: "/dashboard", label: "Kids" },
    { to: "/library", label: "Library" },
    { to: "/settings", label: "Grown-ups" },
  ] as const;
  const kidsNav = [{ to: "/play", label: "Play mode" }] as const;
  const nav = mode === "gups" ? gupsNav : kidsNav;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link to={mode === "gups" ? "/dashboard" : "/play"} className="font-display text-2xl">
            KIDS GET MOVIN'
          </Link>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => switchTo("kids")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${mode === "kids" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Kiddos
            </button>
            <button
              onClick={() => switchTo("gups")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest ${mode === "gups" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              G-ups
            </button>
          </div>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to || pathname.startsWith(n.to + "/");
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {n.label}
                </Link>
              );
            })}
            {mode === "gups" && (
              <button
                onClick={signOut}
                className="ml-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>

      {gateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          onClick={() => setGateOpen(false)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitGate}
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6"
          >
            <h3 className="font-display text-2xl uppercase">
              {gateMode === "set" ? "Set parent passcode" : "Grown-ups passcode"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {gateMode === "set"
                ? "Create a passcode. A parent will enter this to open the Grown-ups area."
                : "Enter the passcode to open the Grown-ups area."}
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              value={entered}
              onChange={(e) => setEntered(e.target.value)}
              placeholder="Passcode"
              className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg tracking-widest"
            />
            {gateMode === "set" && (
              <input
                type="password"
                inputMode="numeric"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Confirm passcode"
                className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-lg tracking-widest"
              />
            )}
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setGateOpen(false)}
                className="flex-1 rounded-full border border-border py-3 font-display uppercase"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 rounded-full bg-primary py-3 font-display uppercase text-primary-foreground"
              >
                {gateMode === "set" ? "Save" : "Unlock"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}