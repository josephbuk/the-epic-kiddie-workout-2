import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// -------- Public catalog (no auth) --------

export const listWorkouts = createServerFn({ method: "GET" }).handler(async () => {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
  const { data, error } = await supabase
    .from("workouts")
    .select("id, slug, title, description, focus, duration_min, difficulty, emoji")
    .order("duration_min", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getWorkout = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const [{ data: w, error: we }, { data: ex, error: ee }] = await Promise.all([
      supabase.from("workouts").select("*").eq("id", data.id).maybeSingle(),
      supabase.from("workout_exercises").select("*").eq("workout_id", data.id).order("ord"),
    ]);
    if (we) throw new Error(we.message);
    if (ee) throw new Error(ee.message);
    if (!w) throw new Error("Workout not found");
    return { workout: w, exercises: ex ?? [] };
  });

// -------- Authenticated: kids --------

export const listKids = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("kids")
      .select("id, name, age, avatar_color, created_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getKid = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: kid, error } = await context.supabase
      .from("kids")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!kid) throw new Error("Kid not found");
    return kid;
  });

export const createKid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(40),
      age: z.number().int().min(5).max(12),
      avatar_color: z.enum(["lime", "orange", "sky", "pink", "violet", "yellow"]),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: kid, error } = await context.supabase
      .from("kids")
      .insert({ ...data, parent_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return kid;
  });

export const deleteKid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("kids").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// -------- Authenticated: assignments --------

export const assignWorkout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      kid_id: z.string().uuid(),
      workout_id: z.string().uuid(),
      scheduled_date: z.string().optional(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { data: a, error } = await context.supabase
      .from("assignments")
      .insert({
        kid_id: data.kid_id,
        workout_id: data.workout_id,
        scheduled_date: data.scheduled_date ?? new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return a;
  });

export const listAssignmentsForKid = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ kid_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("assignments")
      .select("id, scheduled_date, completed_at, workout:workouts(id, title, emoji, focus, duration_min)")
      .eq("kid_id", data.kid_id)
      .order("scheduled_date", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getTodayAssignment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ kid_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: rows, error } = await context.supabase
      .from("assignments")
      .select("id, scheduled_date, completed_at, workout_id, workout:workouts(id, title, emoji, focus, duration_min, description)")
      .eq("kid_id", data.kid_id)
      .eq("scheduled_date", today)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return rows?.[0] ?? null;
  });

export const completeAssignment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("assignments")
      .update({ completed_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAssignmentWithExercises = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: a, error } = await context.supabase
      .from("assignments")
      .select("id, completed_at, workout:workouts(id, title, emoji, description)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!a || !a.workout) throw new Error("Assignment not found");
    const workoutId = Array.isArray(a.workout) ? a.workout[0]?.id : (a.workout as { id: string }).id;
    const { data: ex, error: ee } = await context.supabase
      .from("workout_exercises")
      .select("*")
      .eq("workout_id", workoutId)
      .order("ord");
    if (ee) throw new Error(ee.message);
    return { assignment: a, exercises: ex ?? [] };
  });

export const kidStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ kid_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("assignments")
      .select("completed_at, scheduled_date")
      .eq("kid_id", data.kid_id)
      .not("completed_at", "is", null);
    if (error) throw new Error(error.message);
    const dates = new Set((rows ?? []).map((r) => r.scheduled_date));
    // streak = consecutive days including today going back
    let streak = 0;
    const cursor = new Date();
    for (;;) {
      const iso = cursor.toISOString().slice(0, 10);
      if (dates.has(iso)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else break;
      if (streak > 365) break;
    }
    return { total: rows?.length ?? 0, streak };
  });