import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getKid, kidStats } from "@/lib/api.functions";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_authenticated/play/$kidId/done")({
  head: () => ({ meta: [{ title: "Nice work! — Rungo" }] }),
  component: Done,
});

function Done() {
  const { kidId } = Route.useParams();
  const kidFn = useServerFn(getKid);
  const statsFn = useServerFn(kidStats);
  const { data: kid } = useQuery({ queryKey: ["kid", kidId], queryFn: () => kidFn({ data: { id: kidId } }) });
  const { data: stats } = useQuery({ queryKey: ["stats", kidId], queryFn: () => statsFn({ data: { kid_id: kidId } }) });
  const [emojis, setEmojis] = useState<{ x: number; e: string }[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: 24 }, () => ({
      x: Math.random() * 100,
      e: ["\ud83c\udf89", "\u2b50", "\ud83d\udd25", "\ud83d\udcaa", "\ud83c\udf1f"][Math.floor(Math.random() * 5)],
    }));
    setEmojis(arr);
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
      {emojis.map((c, i) => (
        <span
          key={i}
          className="pointer-events-none absolute animate-bounce text-3xl"
          style={{
            left: `${c.x}%`,
            top: `${-10 + Math.random() * 30}%`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: `${1 + Math.random() * 2}s`,
          }}
        >
          {c.e}
        </span>
      ))}
      <div className="relative z-10 text-center">
        <p className="text-8xl">\ud83c\udfc6</p>
        <h1 className="mt-6 font-display text-6xl uppercase text-primary">Boss!</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Nice work{kid ? `, ${kid.name}` : ""}. You crushed it.
        </p>
        <div className="mt-8 inline-flex items-center gap-6 rounded-3xl border border-border bg-card px-8 py-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Streak</p>
            <p className="font-display text-4xl text-primary">\ud83d\udd25 {stats?.streak ?? 1}</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Total</p>
            <p className="font-display text-4xl">{stats?.total ?? 1}</p>
          </div>
        </div>
        <div className="mt-10 flex justify-center gap-3">
          <Link to="/play/$kidId" params={{ kidId }} className="rounded-full bg-primary px-6 py-3 font-semibold uppercase text-primary-foreground">
            Back home
          </Link>
          <Link to="/play" className="rounded-full border border-border px-6 py-3 font-semibold uppercase">
            Switch kid
          </Link>
        </div>
      </div>
    </div>
  );
}