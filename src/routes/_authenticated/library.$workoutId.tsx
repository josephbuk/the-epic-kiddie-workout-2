import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getWorkout, listKids, assignWorkout } from "@/lib/api.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/library/$workoutId")({
  loader: async ({ params, context }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["workout", params.workoutId],
      queryFn: () => getWorkout({ data: { id: params.workoutId } }),
    }),
  head: ({ params, loaderData }) => {
    const title = loaderData?.workout?.title ?? "Workout";
    const desc = loaderData?.workout?.description
      ? `${loaderData.workout.description} A ${loaderData.workout.duration_min}-minute ${loaderData.workout.focus} workout for kids.`
      : "See exactly what's in this kid workout and assign it for today.";
    const url = `https://workyourkidout.lovable.app/library/${params.workoutId}`;
    return {
      meta: [
        { title: `${title} — Kids Get Movin'` },
        { name: "description", content: desc.slice(0, 160) },
        { property: "og:title", content: `${title} — Kids Get Movin'` },
        { property: "og:description", content: desc.slice(0, 160) },
        { property: "og:url", content: url },
        { name: "robots", content: "noindex" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: WorkoutDetail,
});

function WorkoutDetail() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getWorkout);
  const kidsFn = useServerFn(listKids);
  const assignFn = useServerFn(assignWorkout);

  const { data } = useQuery({ queryKey: ["workout", workoutId], queryFn: () => getFn({ data: { id: workoutId } }) });
  const { data: kids = [] } = useQuery({ queryKey: ["kids"], queryFn: () => kidsFn() });

  const assign = useMutation({
    mutationFn: (kid_id: string) => assignFn({ data: { kid_id, workout_id: workoutId } }),
    onSuccess: (_, kid_id) => {
      toast.success("Assigned for today!");
      navigate({ to: "/kids/$kidId", params: { kidId: kid_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!data) return <p className="text-muted-foreground">Loading…</p>;
  const { workout, exercises } = data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="text-6xl">{workout.emoji}</div>
        <h1 className="mt-4 font-display text-5xl uppercase">{workout.title}</h1>
        <p className="mt-2 text-muted-foreground">{workout.description}</p>
        <div className="mt-4 flex gap-2 text-xs uppercase tracking-widest">
          <span className="rounded-full bg-muted px-3 py-1">{workout.duration_min} min</span>
          <span className="rounded-full bg-muted px-3 py-1">{workout.difficulty}</span>
          <span className="rounded-full bg-muted px-3 py-1">{workout.focus}</span>
        </div>

        <h2 className="mt-10 font-display text-2xl uppercase">Exercises</h2>
        <ol className="mt-4 space-y-2">
          {exercises.map((ex, i) => (
            <li key={ex.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
              <div className="font-display text-2xl text-primary">{String(i + 1).padStart(2, "0")}</div>
              <div className="text-3xl">{ex.emoji}</div>
              <div className="flex-1">
                <p className="font-semibold">{ex.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ex.duration_sec ? `${ex.duration_sec}s` : `${ex.reps} reps`}
                  {ex.rest_sec ? ` · ${ex.rest_sec}s rest` : ""}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <aside className="rounded-3xl border border-border bg-card p-6 lg:sticky lg:top-24 lg:self-start">
        <h3 className="font-display text-xl uppercase">Assign to</h3>
        {kids.length === 0 ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Add a kid first.</p>
            <Link
              to="/kids/new"
              className="mt-4 inline-block rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase text-primary-foreground"
            >
              Add kid
            </Link>
          </>
        ) : (
          <ul className="mt-4 space-y-2">
            {kids.map((k) => (
              <li key={k.id}>
                <button
                  onClick={() => assign.mutate(k.id)}
                  disabled={assign.isPending}
                  className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 hover:border-primary disabled:opacity-60"
                >
                  <span className="font-semibold">{k.name}</span>
                  <span className="text-xs uppercase text-muted-foreground">Assign today →</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}