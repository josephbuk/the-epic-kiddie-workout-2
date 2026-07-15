## What we're building

A workout app for kids ages 5-12 where **parents pick the workouts** and **kids follow them**. Two connected experiences under one account: a parent side (assign workouts, watch progress) and a kid side (do today's workout, earn streaks). Ladder-inspired visual language: dark background, bold uppercase display type, high-contrast athletic feel — softened for kids with a bright accent color, rounded cards, and playful exercise illustrations.

## Core flows

**Parent (account owner)**

- Sign up / log in (email + password, Google)
- Add one or more kids to their account (name, age 5-12, avatar)
- Browse a workout library (bodyweight routines, ~1 min-1 hr  tagged by focus: full body, strength, cardio, flexibility)
- Assign a workout to a kid for a specific day (or a weekly plan)
- See each kid's streak, completed workouts, and minutes moved

**Kid (uses parent's device, picks their profile)**

- Tap their avatar on a profile picker (no separate password — parent-managed)
- See "Today's Workout" assigned by parent
- Run the guided workout: exercise name, illustration, timer or rep count, rest between sets, encouraging cues
- Finish screen: confetti, streak +1, "Great job!" summary
- History tab: calendar of completed days, current streak, total minutes

## Screens / routes

```text
/                          Marketing landing (hero, "for parents & kids 5-12")
/auth                      Sign in / sign up (parent)
/_authenticated
  /dashboard               Parent home: kids list, quick assign
  /kids/new                Add a kid
  /kids/$kidId             Kid detail: assigned plan, progress, history
  /library                 Workout library (browse + filter)
  /library/$workoutId      Workout detail + assign to kid
  /play                    Kid profile picker (choose avatar)
  /play/$kidId             Kid home: today's workout + streak
  /play/$kidId/workout     Guided workout runner (fullscreen)
  /play/$kidId/done        Completion celebration
```

## Data model (Lovable Cloud)

- `profiles` — parent profile (linked to auth.users)
- `kids` — id, parent_id, name, age, avatar_key
- `workouts` — id, title, description, focus_tags, duration_min, difficulty (seeded catalog, ~15 starter workouts)
- `workout_exercises` — id, workout_id, order, name, illustration_key, duration_sec or reps, rest_sec, cue_text
- `assignments` — id, kid_id, workout_id, scheduled_date, status (assigned/completed), completed_at
- `user_roles` — separate roles table (parent role) per the roles pattern

RLS: parents can only read/write their own kids, assignments, and completions. Workouts table is publicly readable.

## Design direction

Ladder-inspired, kid-adapted:

- **Background:** near-black (`oklch(0.18 0.02 260)`)
- **Foreground:** off-white
- **Accent (primary):** electric lime/yellow-green — bold, energetic, differentiates from adult Ladder red
- **Secondary accent:** warm orange for streaks/celebrations
- **Type:** bold uppercase display for headings (a strong sans like Archivo Black or Anton via Google Fonts), clean geometric sans for body (Inter)
- **Shapes:** rounded-2xl cards, chunky buttons, big timer numerals
- **Motion:** snappy transitions, timer count-down pulse, confetti on completion

All colors as semantic tokens in `src/styles.css` (oklch).

## Technical notes

- TanStack Start file-based routes under `src/routes/`; use `_authenticated/` layout for parent-only pages
- Kid `/play/*` routes live under `_authenticated/` too (parent must be signed in on the device); kid selects their profile via avatar picker, no separate auth
- Server functions (`createServerFn` + `requireSupabaseAuth`) for all reads/writes; RLS enforced
- Seed the workout catalog in the same migration that creates the schema
- Illustrations: generate a small set of exercise illustrations (jumping jacks, squats, push-ups, plank, etc.) as PNGs in `src/assets/`
- Timer/runner is client-side React state; store only the final completion server-side
- Head metadata: real app title/description on `__root.tsx` and each route

## Out of scope (unless you ask)

- In-app payments / subscriptions
- Video content (using illustrations + timers)
- Social features between kids
- Wearable / heart-rate integration
- Native mobile app (this is a responsive web app)

## Build order

1. Enable Lovable Cloud, set up auth (email + Google), profiles + user_roles
2. Migration: kids, workouts, workout_exercises, assignments + seed catalog
3. Design tokens + typography in `src/styles.css`
4. Landing page + auth
5. Parent: dashboard, add kid, workout library, assign flow
6. Kid: profile picker, today's workout, guided runner, completion screen
7. Progress: kid detail page for parent, history for kid
8. Polish: illustrations, motion, empty states