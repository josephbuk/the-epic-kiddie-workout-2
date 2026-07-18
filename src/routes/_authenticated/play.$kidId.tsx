import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getKid, getTodayAssignment, kidStats } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated/play/$kidId")({
  head: () => ({ meta: [{ title: "Today — Kids Get Movin'" }] }),
  component: KidHome,
});

function KidHome() {
  const { kidId } = Route.useParams();
  const kidFn = useServerFn(getKid);
  const todayFn = useServerFn(getTodayAssignment);
  const statsFn = useServerFn(kidStats);

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
            <Link
              to="/play/$kidId/workout"
              params={{ kidId }}
              search={{ a: today.id }}
              className="mt-6 block rounded-full bg-primary py-5 text-center font-display text-2xl uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30"
            >
              I DID IT
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl uppercase">No workout today</p>
          <p className="mt-2 text-muted-foreground">Ask a parent to pick one for you.</p>
        </div>
      )}
    </div>
  );
}