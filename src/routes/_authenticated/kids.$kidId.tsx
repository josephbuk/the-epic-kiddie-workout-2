import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getKid, listAssignmentsForKid, kidStats } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated/kids/$kidId")({
  head: () => ({ meta: [{ title: "Kid — Rungo" }] }),
  component: KidDetail,
});

function KidDetail() {
  const { kidId } = Route.useParams();
  const kidFn = useServerFn(getKid);
  const listFn = useServerFn(listAssignmentsForKid);
  const statsFn = useServerFn(kidStats);

  const { data: kid } = useQuery({ queryKey: ["kid", kidId], queryFn: () => kidFn({ data: { id: kidId } }) });
  const { data: assignments = [] } = useQuery({
    queryKey: ["assignments", kidId],
    queryFn: () => listFn({ data: { kid_id: kidId } }),
  });
  const { data: stats } = useQuery({
    queryKey: ["stats", kidId],
    queryFn: () => statsFn({ data: { kid_id: kidId } }),
  });

  if (!kid) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Kid profile</p>
          <h1 className="font-display text-5xl uppercase">{kid.name}</h1>
          <p className="text-muted-foreground">Age {kid.age}</p>
        </div>
        <Link
          to="/library"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold uppercase text-primary-foreground"
        >
          + Assign workout
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Streak</p>
          <p className="mt-2 font-display text-6xl text-primary">{stats?.streak ?? 0}<span className="text-lg text-muted-foreground"> days</span></p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Workouts done</p>
          <p className="mt-2 font-display text-6xl">{stats?.total ?? 0}</p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl uppercase">History</h2>
        {assignments.length === 0 ? (
          <p className="mt-4 text-muted-foreground">Nothing assigned yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-3xl border border-border bg-card">
            {assignments.map((a) => {
              const w = Array.isArray(a.workout) ? a.workout[0] : a.workout;
              return (
                <li key={a.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{w?.emoji}</span>
                    <div>
                      <p className="font-semibold">{w?.title}</p>
                      <p className="text-xs text-muted-foreground">{a.scheduled_date}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${a.completed_at ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                    {a.completed_at ? "Done" : "Pending"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}