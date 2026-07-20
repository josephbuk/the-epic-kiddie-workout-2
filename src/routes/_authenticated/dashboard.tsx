import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listKids, deleteKid } from "@/lib/api.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your kids — Kids Get Movin'" },
      { name: "description", content: "Manage your kids, assign guided workouts, and track their streaks from one dashboard." },
      { property: "og:title", content: "Your kids — Kids Get Movin'" },
      { property: "og:description", content: "Manage your kids, assign guided workouts, and track their streaks from one dashboard." },
      { property: "og:url", content: "https://workyourkidout.lovable.app/dashboard" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "https://workyourkidout.lovable.app/dashboard" }],
  }),
  component: Dashboard,
});

const COLOR_MAP: Record<string, string> = {
  lime: "bg-primary text-primary-foreground",
  orange: "bg-secondary text-secondary-foreground",
  sky: "bg-sky-400 text-slate-900",
  pink: "bg-pink-400 text-slate-900",
  violet: "bg-violet-400 text-slate-900",
  yellow: "bg-yellow-300 text-slate-900",
};

function Dashboard() {
  const queryClient = useQueryClient();
  const fetchKids = useServerFn(listKids);
  const remove = useServerFn(deleteKid);
  const { data: kids = [], isLoading } = useQuery({
    queryKey: ["kids"],
    queryFn: () => fetchKids(),
  });

  const del = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["kids"] });
      const prev = queryClient.getQueryData<typeof kids>(["kids"]);
      queryClient.setQueryData<typeof kids>(["kids"], (old = []) => old.filter((k) => k.id !== id));
      return { prev };
    },
    onSuccess: () => {
      toast.success("Kid removed");
      queryClient.invalidateQueries({ queryKey: ["kids"] });
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["kids"], ctx.prev);
      toast.error(e.message || "Failed to remove kid");
    },
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your crew</p>
          <h1 className="font-display text-4xl uppercase">Kids</h1>
        </div>
        <Link
          to="/kids/new"
          className="rounded-full bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-wide text-primary-foreground"
        >
          + Add kid
        </Link>
      </div>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Loading…</p>
      ) : kids.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl uppercase">No kids yet</p>
          <p className="mt-2 text-muted-foreground">Add your first kid to start assigning workouts.</p>
          <Link
            to="/kids/new"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase text-primary-foreground"
          >
            Add a kid
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map((k) => (
            <div key={k.id} className="rounded-3xl border border-border bg-card p-6">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl font-display text-2xl ${COLOR_MAP[k.avatar_color] ?? COLOR_MAP.lime}`}>
                {k.name.slice(0, 1).toUpperCase()}
              </div>
              <h2 className="mt-4 font-display text-2xl uppercase">{k.name}</h2>
              <p className="text-sm text-muted-foreground">Age {k.age}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  to="/kids/$kidId"
                  params={{ kidId: k.id }}
                  className="flex-1 rounded-full bg-primary py-2 text-center text-xs font-semibold uppercase text-primary-foreground"
                >
                  Manage
                </Link>
                <Link
                  to="/library"
                  className="flex-1 rounded-full border border-border py-2 text-center text-xs font-semibold uppercase"
                >
                  Assign
                </Link>
                <button
                  onClick={() => {
                    if (confirm(`Remove ${k.name}?`)) del.mutate(k.id);
                  }}
                  className="rounded-full border border-border px-3 text-xs text-muted-foreground hover:text-destructive"
                  aria-label={`Delete ${k.name}`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}