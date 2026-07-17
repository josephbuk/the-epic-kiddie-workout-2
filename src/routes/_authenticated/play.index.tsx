import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listKids } from "@/lib/api.functions";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({ meta: [{ title: "Who's playing? — Kids Get Movin'" }] }),
  component: Play,
});

const COLOR_MAP: Record<string, string> = {
  lime: "bg-[oklch(0.88_0.22_128)]",
  orange: "bg-[oklch(0.75_0.19_55)]",
  sky: "bg-sky-400",
  pink: "bg-pink-400",
  violet: "bg-violet-400",
  yellow: "bg-yellow-300",
};

function Play() {
  const fn = useServerFn(listKids);
  const { data = [] } = useQuery({ queryKey: ["kids"], queryFn: () => fn() });

  return (
    <div className="min-h-[70vh]">
      <h1 className="text-center font-display text-4xl uppercase sm:text-6xl">Who's playing?</h1>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((k) => (
          <Link
            key={k.id}
            to="/play/$kidId"
            params={{ kidId: k.id }}
            className="group flex flex-col items-center rounded-3xl border border-border bg-card p-8 transition hover:-translate-y-1 hover:border-primary"
          >
            <div className={`flex h-32 w-32 items-center justify-center rounded-3xl font-display text-6xl text-slate-900 ${COLOR_MAP[k.avatar_color] ?? COLOR_MAP.lime}`}>
              {k.name.slice(0, 1).toUpperCase()}
            </div>
            <p className="mt-4 font-display text-2xl uppercase">{k.name}</p>
          </Link>
        ))}
        {data.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed border-border p-12 text-center">
            <p className="font-display text-2xl uppercase">No kids yet</p>
            <Link to="/kids/new" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-semibold uppercase text-primary-foreground">
              Add a kid
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}