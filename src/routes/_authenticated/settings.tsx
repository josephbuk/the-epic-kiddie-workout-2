import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validatePasscode } from "@/lib/passcode";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Grown-ups — Kids Get Movin'" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const [parentId, setParentId] = useState<string | null>(null);
  const [parentEmail, setParentEmail] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setParentId(data.user?.id ?? null);
      setParentEmail(data.user?.email ?? null);
    });
  }, []);

  const passKey = parentId ? `kgm_passcode_${parentId}` : null;
  const hasExisting = passKey ? !!localStorage.getItem(passKey) : false;

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!parentEmail) return setErr("No account email found");
    if (email.trim().toLowerCase() !== parentEmail.toLowerCase()) {
      return setErr("That's not the grown-up's email on this account");
    }
    setUnlocked(true);
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!passKey) return;
    const v = validatePasscode(newPass);
    if (v) return setErr(v);
    if (newPass !== confirm) return setErr("Passcodes don't match");
    localStorage.setItem(passKey, newPass);
    setNewPass("");
    setConfirm("");
    toast.success("Passcode updated");
  };

  const clear = () => {
    if (!passKey) return;
    localStorage.removeItem(passKey);
    toast.success("Passcode cleared — you'll set a new one next time");
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-display text-4xl uppercase">Grown-ups only</h1>
      <p className="mt-1 text-muted-foreground">Change the parent passcode used to confirm workouts.</p>

      {!unlocked ? (
        <form onSubmit={verify} className="mt-8 rounded-3xl border border-border bg-card p-6">
          <label className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Confirm your account email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@parent.com"
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3"
          />
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <button className="mt-4 w-full rounded-full bg-primary py-3 font-display uppercase text-primary-foreground">
            Unlock
          </button>
        </form>
      ) : (
        <form onSubmit={save} className="mt-8 rounded-3xl border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">
            {hasExisting ? "Set a new passcode." : "No passcode set yet — create one."} Must be 4+ digits, not
            all the same digit, and not a simple sequence like 1234 or 9876.
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="New passcode"
            className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 tracking-widest"
          />
          <input
            type="password"
            inputMode="numeric"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm passcode"
            className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 tracking-widest"
          />
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
          <button className="mt-4 w-full rounded-full bg-primary py-3 font-display uppercase text-primary-foreground">
            Save passcode
          </button>
          {hasExisting && (
            <button
              type="button"
              onClick={clear}
              className="mt-3 w-full rounded-full border border-border py-3 text-sm uppercase"
            >
              Clear current passcode
            </button>
          )}
        </form>
      )}
    </div>
  );
}