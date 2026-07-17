import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getAssignmentWithExercises, completeAssignment } from "@/lib/api.functions";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  saveAssignment,
  loadAssignment,
  queueCompletion,
  flushCompletionQueue,
} from "@/lib/offline-cache";

export const Route = createFileRoute("/_authenticated/play/$kidId/workout")({
  validateSearch: z.object({ a: z.string().uuid() }),
  head: () => ({ meta: [{ title: "Workout — Kids Get Movin'" }] }),
  component: Runner,
});

type Phase = "work" | "rest" | "done";

function Runner() {
  const { kidId } = Route.useParams();
  const { a: assignmentId } = Route.useSearch();
  const navigate = useNavigate();
  const fn = useServerFn(getAssignmentWithExercises);
  const complete = useServerFn(completeAssignment);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const { data } = useQuery({
    queryKey: ["assignment", assignmentId],
    queryFn: async () => {
      try {
        const fresh = await fn({ data: { id: assignmentId } });
        saveAssignment(assignmentId, fresh);
        return fresh;
      } catch (err) {
        const cached = loadAssignment<Awaited<ReturnType<typeof fn>>>(assignmentId);
        if (cached) {
          setOffline(true);
          return cached;
        }
        throw err;
      }
    },
    initialData: () =>
      loadAssignment<Awaited<ReturnType<typeof fn>>>(assignmentId) ?? undefined,
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    const onOnline = () => {
      setOffline(false);
      flushCompletionQueue((id) => complete({ data: { id } }));
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [complete]);

  const exercises = data?.exercises ?? [];
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("work");
  const [remaining, setRemaining] = useState<number>(0);
  const [paused, setPaused] = useState(false);

  const current = exercises[idx];

  const initialSeconds = useMemo(() => {
    if (!current) return 0;
    if (phase === "work") return current.duration_sec ?? 20;
    return current.rest_sec ?? 0;
  }, [current, phase]);

  useEffect(() => {
    setRemaining(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (paused || phase === "done" || !current) return;
    const t = setInterval(() => {
      setRemaining((r) => {
        if (r > 1) return r - 1;
        clearInterval(t);
        if (phase === "work") {
          if ((current.rest_sec ?? 0) > 0 && idx < exercises.length - 1) {
            setPhase("rest");
          } else if (idx < exercises.length - 1) {
            setIdx((i) => i + 1);
            setPhase("work");
          } else {
            setPhase("done");
          }
        } else {
          setIdx((i) => i + 1);
          setPhase("work");
        }
        return 0;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [paused, phase, current, idx, exercises.length]);

  useEffect(() => {
    if (phase === "done") {
      complete({ data: { id: assignmentId } })
        .catch(() => {
          queueCompletion(assignmentId);
        })
        .finally(() => {
          navigate({ to: "/play/$kidId/done", params: { kidId } });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!data) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading\u2026</div>;
  if (!current) return null;

  const isRest = phase === "rest";
  const progress = ((idx + (isRest ? 0.5 : 0)) / exercises.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-2xl flex-col px-6 py-6">
        {offline && (
          <div className="mb-3 rounded-full bg-secondary/20 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-secondary">
            Offline — using saved workout
          </div>
        )}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
          Exercise {idx + 1} of {exercises.length}
        </p>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-12 text-center">
        {isRest ? (
          <>
            <p className="font-display text-3xl uppercase text-secondary">Rest</p>
            <p className="mt-2 text-muted-foreground">Next up: {exercises[idx + 1]?.name}</p>
          </>
        ) : (
          <>
            <div className="text-8xl">{current.emoji}</div>
            <h1 className="mt-6 font-display text-5xl uppercase sm:text-7xl">{current.name}</h1>
            <p className="mt-3 max-w-md text-muted-foreground">{current.cue}</p>
          </>
        )}

        <div className={`mt-10 font-display text-[9rem] leading-none ${isRest ? "text-secondary" : "text-primary"}`}>
          {current.duration_sec || isRest ? remaining : `\u00d7${current.reps}`}
        </div>
        {!current.duration_sec && !isRest && (
          <p className="text-sm uppercase tracking-widest text-muted-foreground">reps \u2014 tap next when done</p>
        )}

        <div className="mt-10 flex gap-3">
          <button
            onClick={() => setPaused((p) => !p)}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase hover:bg-muted"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={() => {
              if (phase === "work" && (current.rest_sec ?? 0) > 0 && idx < exercises.length - 1) {
                setPhase("rest");
              } else if (idx < exercises.length - 1) {
                setIdx((i) => i + 1);
                setPhase("work");
              } else {
                setPhase("done");
              }
            }}
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold uppercase text-primary-foreground"
          >
            Skip \u2192
          </button>
          <button
            onClick={() => navigate({ to: "/play/$kidId", params: { kidId } })}
            className="rounded-full border border-border px-6 py-3 text-sm font-semibold uppercase text-muted-foreground hover:text-foreground"
          >
            Quit
          </button>
        </div>
      </div>
    </div>
  );
}