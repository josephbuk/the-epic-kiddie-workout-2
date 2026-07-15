import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { createKid } from "@/lib/api.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/kids/new")({
  head: () => ({ meta: [{ title: "Add kid — Rungo" }] }),
  component: NewKid,
});

const COLORS = [
  { id: "lime", cls: "bg-[oklch(0.88_0.22_128)]" },
  { id: "orange", cls: "bg-[oklch(0.75_0.19_55)]" },
  { id: "sky", cls: "bg-sky-400" },
  { id: "pink", cls: "bg-pink-400" },
  { id: "violet", cls: "bg-violet-400" },
  { id: "yellow", cls: "bg-yellow-300" },
] as const;

function NewKid() {
  const navigate = useNavigate();
  const create = useServerFn(createKid);
  const [name, setName] = useState("");
  const [age, setAge] = useState(8);
  const [color, setColor] = useState<(typeof COLORS)[number]["id"]>("lime");

  const m = useMutation({
    mutationFn: () => create({ data: { name, age, avatar_color: color } }),
    onSuccess: () => {
      toast.success("Kid added!");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-4xl uppercase">Add a kid</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          m.mutate();
        }}
        className="mt-8 space-y-6 rounded-3xl border border-border bg-card p-8"
      >
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Name</label>
          <input
            required
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Alex"
          />
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Age: {age}</label>
          <input
            type="range"
            min={5}
            max={12}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="w-full accent-[oklch(0.88_0.22_128)]"
          />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>5</span><span>12</span>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">Color</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`h-12 w-12 rounded-2xl ${c.cls} ${color === c.id ? "ring-4 ring-primary ring-offset-2 ring-offset-card" : ""}`}
                aria-label={c.id}
              />
            ))}
          </div>
        </div>
        <button
          disabled={m.isPending}
          className="w-full rounded-full bg-primary py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground disabled:opacity-60"
        >
          {m.isPending ? "Adding…" : "Add kid"}
        </button>
      </form>
    </div>
  );
}