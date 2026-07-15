import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listWorkouts } from "@/lib/api.functions";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({ meta: [{ title: "Workout library — Rungo" }] }),
  component: Library,
});

const FOCUSES = ["all", "warmup", "cardio", "strength", "agility", "flexibility"] as const;

function Library() {
  const fn = useServerFn(listWorkouts);
  const { data = [] } = useQuery({ queryKey: ["workouts"], queryFn: () => fn() });
  const [focus, setFocus] = useState<(typeof FOCUSES)[number]>("all");

  const filtered = focus === "all" ? data : data.filter((w) => w.focus === focus);

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Catalog</p>
      <h1 className="font-display text-4xl uppercase">Workout Library</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {FOCUSES.map((f) => (
          <button
            key={f}
            onClick={() => setFocus(f)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${focus === f ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((w) => (
          <Link
            key={w.id}
            to="/library/$workoutId"
            params={{ workoutId: w.id }}
            className="group rounded-3xl border border-border bg-card p-6 transition hover:border-primary"
          >
            <div className="text-5xl">{w.emoji}</div>
            <h3 className="mt-4 font-display text-2xl uppercase">{w.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{w.description}</p>
            <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">{w.duration_min} min</span>
              <span className="rounded-full bg-muted px-2 py-1">{w.difficulty}</span>
              <span className="rounded-full bg-muted px-2 py-1">{w.focus}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}