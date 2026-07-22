import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kids Get Movin' — Guided workouts for kids, parent-picked" },
      { name: "description", content: "Kids workout app with parental controls to help children." },
      { property: "og:title", content: "Kids Get Movin' — Guided workouts for kids, parent-picked" },
      { property: "og:description", content: "Kids workout app with parental controls to help children." },
      { property: "og:url", content: "https://workyourkidout.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://workyourkidout.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="font-display text-2xl tracking-tight">KIDS GET MOVIN'</div>
        <div className="flex gap-3">
          <Link
            to="/auth"
            className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-muted"
          >
            Sign in
          </Link>
          <Link
            to="/auth"
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="mb-6 inline-block rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          For parents & kids 5–12
        </p>
        <h1 className="font-display text-6xl uppercase leading-[0.95] tracking-tight sm:text-8xl">
          Guided workouts for kids that <span className="text-primary">parents pick</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Parent-picked guided workouts your kid actually wants to press play on. Bodyweight
          routines, big timers, big cheers, and a streak worth showing off.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to="/auth"
            className="rounded-full bg-primary px-8 py-4 text-base font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90"
          >
            Start free
          </Link>
          <a
            href="#how"
            className="rounded-full border border-border px-8 py-4 text-base font-semibold uppercase tracking-wide hover:bg-muted"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="border-t border-border bg-card/40" aria-labelledby="how-heading">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 id="how-heading" className="font-display text-3xl uppercase sm:text-4xl">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { n: "01", t: "Add your kid", d: "Name, age, and a color. That's it." },
            { n: "02", t: "Pick a workout", d: "Browse the catalog. Assign it for today." },
            { n: "03", t: "Kid presses play", d: "Guided timer, cues, and a big win screen." },
          ].map((s) => (
            <div key={s.n} className="rounded-3xl border border-border bg-card p-8">
              <div className="font-display text-5xl text-primary">{s.n}</div>
              <h3 className="mt-4 font-display text-2xl uppercase">{s.t}</h3>
              <p className="mt-2 text-muted-foreground">{s.d}</p>
            </div>
          ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Kids Get Movin'. Move like a boss.
      </footer>
    </div>
  );
}
