import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getKid, getTodayAssignment, kidStats } from "@/lib/api.functions";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/play/$kidId")({
  head: () => ({ meta: [{ title: "Today — Kids Get Movin'" }] }),
  component: KidHome,
});

function KidHome() {
  const { kidId } = Route.useParams();
  const kidFn = useServerFn(getKid);
  const todayFn = useServerFn(getTodayAssignment);
  const statsFn = useServerFn(kidStats);
  const navigate = useNavigate();
  const [gateOpen, setGateOpen] = useState(false);
  const [entered, setEntered] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"enter" | "set">("enter");
  const [confirmPass, setConfirmPass] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setParentId(data.user?.id ?? null));
  }, []);

  const passKey = parentId ? `kgm_passcode_${parentId}` : null;

  function openGate() {
    if (!passKey) return;
    const existing = localStorage.getItem(passKey);
    setMode(existing ? "enter" : "set");
    setEntered("");
    setConfirmPass("");
    setError(null);
    setGateOpen(true);
  }

  function submitGate(e: React.FormEvent) {
    e.preventDefault();
    if (!passKey) return;
    if (mode === "set") {
      if (entered.length < 4) return setError("Use at least 4 digits");
      if (entered !== confirmPass) return setError("Passcodes don't match");
      localStorage.setItem(passKey, entered);
    } else {
      const stored = localStorage.getItem(passKey);
      if (entered !== stored) return setError("Wrong passcode");
    }
    setGateOpen(false);
    navigate({ to: "/play/$kidId/workout", params: { kidId }, search: { a: today!.id } });
  }

  const { data: kid } = useQuery({ queryKey: ["kid", kidId], queryFn: () => kidFn({ data: { id: kidId } }) });
  const { data: today } = useQuery({ queryKey: ["today", kidId], queryFn: () => todayFn({ data: { kid_id: kidId } }) });
  const { data: stats } = useQuery({ queryKey: ["stats", kidId], queryFn: () => statsFn({ data: { kid_id: kidId } }) });

  if (!kid) return null;

  const w = today?.workout && (Array.isArray(today.workout) ? today.workout[0] : today.workout);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between">
        <Link to="/play" className="text-sm text-muted-foreground hover:text-foreground">← Switch kid</Link>
        <div className="rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase text-primary-foreground">
          🔥 {stats?.streak ?? 0} day streak
        </div>
      </div>

      <h1 className="mt-8 font-display text-5xl uppercase">Hey {kid.name}!</h1>
      <p className="mt-1 text-muted-foreground">Today's workout is ready.</p>

      {today && w ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-8">
          <div className="text-7xl">{w.emoji}</div>
          <h2 className="mt-4 font-display text-4xl uppercase">{w.title}</h2>
          <p className="mt-2 text-muted-foreground">{w.description}</p>
          <p className="mt-4 text-sm uppercase tracking-widest text-muted-foreground">
            {w.duration_min} min · {w.focus}
          </p>
          {today.completed_at ? (
            <div className="mt-6 rounded-2xl bg-primary/10 p-4 text-center">
              <p className="font-display text-2xl uppercase text-primary">✓ Done today!</p>
              <p className="text-sm text-muted-foreground">Come back tomorrow.</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={openGate}
              className="mt-6 block w-full rounded-full bg-primary py-5 text-center font-display text-2xl uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30"
            >
              I DID IT
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl uppercase">No workout today</p>
          <p className="mt-2 text-muted-foreground">Ask a parent to pick one for you.</p>
        </div>
      )}

      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6" onClick={() => setGateOpen(false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitGate}
            className="w-full max-w-sm rounded-3xl border border-border bg-card p-6"
          >
            <h3 className="font-display text-2xl uppercase">
              {mode === "set" ? "Set parent passcode" : "Parent passcode"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {mode === "set"
                ? "Create a passcode. A parent will enter this to confirm workouts."
                : "A parent/guardian must enter the passcode to confirm."}
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
            {mode === "set" && (
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
                {mode === "set" ? "Save" : "Confirm"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}