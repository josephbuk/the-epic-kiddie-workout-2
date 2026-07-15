
-- Profiles for parents
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Kids
CREATE TABLE public.kids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT NOT NULL CHECK (age BETWEEN 5 AND 12),
  avatar_color TEXT NOT NULL DEFAULT 'lime',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids TO authenticated;
GRANT ALL ON public.kids TO service_role;
ALTER TABLE public.kids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent manages own kids" ON public.kids FOR ALL TO authenticated
  USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());

-- Workouts catalog
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  focus TEXT NOT NULL,
  duration_min INT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  emoji TEXT NOT NULL DEFAULT '💪',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.workouts TO authenticated, anon;
GRANT ALL ON public.workouts TO service_role;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workouts readable" ON public.workouts FOR SELECT TO authenticated, anon USING (true);

-- Exercises inside a workout
CREATE TABLE public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  ord INT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🏃',
  duration_sec INT,
  reps INT,
  rest_sec INT NOT NULL DEFAULT 15,
  cue TEXT NOT NULL DEFAULT 'You got this!'
);
GRANT SELECT ON public.workout_exercises TO authenticated, anon;
GRANT ALL ON public.workout_exercises TO service_role;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises readable" ON public.workout_exercises FOR SELECT TO authenticated, anon USING (true);

-- Assignments (a workout scheduled for a kid on a date)
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_id UUID NOT NULL REFERENCES public.kids(id) ON DELETE CASCADE,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parent manages own assignments" ON public.assignments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.kids k WHERE k.id = kid_id AND k.parent_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.kids k WHERE k.id = kid_id AND k.parent_id = auth.uid()));

CREATE INDEX assignments_kid_date_idx ON public.assignments(kid_id, scheduled_date);

-- Seed 6 starter workouts
INSERT INTO public.workouts (slug, title, description, focus, duration_min, difficulty, emoji) VALUES
('warm-up-wiggle',  'Warm Up Wiggle',    'Quick full-body wake-up before anything else.',       'warmup',   5,  'easy',   '🌅'),
('jump-start',      'Jump Start',        'Explosive cardio moves to get the heart pumping.',    'cardio',   10, 'medium', '⚡'),
('super-strong',    'Super Strong',      'Bodyweight strength builder for growing muscles.',    'strength', 15, 'medium', '💪'),
('ninja-flow',      'Ninja Flow',        'Balance, agility, and control like a real ninja.',    'agility',  12, 'medium', '🥷'),
('stretch-out',     'Stretch Out',       'Cool-down stretches for flexibility and calm.',       'flexibility', 8,  'easy', '🧘'),
('boss-battle',     'Boss Battle',       'The hardest challenge. Push through and win.',        'strength', 20, 'hard',   '🔥');

-- Exercises for each workout
WITH w AS (SELECT id FROM public.workouts WHERE slug = 'warm-up-wiggle')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Arm Circles',   '🌀', 30, 5,  'Big slow circles, then small fast ones!'),
((SELECT id FROM w), 2, 'March in Place','🚶', 45, 10, 'Lift those knees high!'),
((SELECT id FROM w), 3, 'Side Bends',    '🤸', 30, 10, 'Reach for the sky, then to the side.'),
((SELECT id FROM w), 4, 'Toe Touches',   '👟', 30, 10, 'Bend your knees if you need to.'),
((SELECT id FROM w), 5, 'Shake It Out',  '💃', 20, 0,  'Shake every part of you!');

WITH w AS (SELECT id FROM public.workouts WHERE slug = 'jump-start')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Jumping Jacks',  '⭐', 40, 15, 'Fast arms, fast legs!'),
((SELECT id FROM w), 2, 'High Knees',     '🦵', 30, 15, 'Knees up to your belly!'),
((SELECT id FROM w), 3, 'Bunny Hops',     '🐰', 30, 15, 'Small quick jumps, feet together.'),
((SELECT id FROM w), 4, 'Skater Jumps',   '⛸️', 40, 20, 'Side to side like an ice skater.'),
((SELECT id FROM w), 5, 'Star Jumps',     '🌟', 30, 15, 'Explode into a big star shape!'),
((SELECT id FROM w), 6, 'Fast Feet',      '👣', 30, 0,  'Tiny quick steps like the floor is lava.');

WITH w AS (SELECT id FROM public.workouts WHERE slug = 'super-strong')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, reps, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Squats',       '🏋️', NULL, 12, 15, 'Sit back like there''s a chair behind you.'),
((SELECT id FROM w), 2, 'Push-Ups',     '💥', NULL, 8,  20, 'Knees on floor is totally fine!'),
((SELECT id FROM w), 3, 'Plank Hold',   '🪵', 30,   NULL, 20, 'Straight line from head to heels.'),
((SELECT id FROM w), 4, 'Lunges',       '🦶', NULL, 10, 15, 'Big step, back knee toward floor.'),
((SELECT id FROM w), 5, 'Superman',     '🦸', 30,   NULL, 15, 'Arms and legs up, hold like flying!'),
((SELECT id FROM w), 6, 'Wall Sit',     '🧱', 30,   NULL, 0,  'Back flat on the wall, knees at 90°.');

WITH w AS (SELECT id FROM public.workouts WHERE slug = 'ninja-flow')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Tiptoe Balance',  '🩰', 30, 10, 'Balance on your toes. No wobbles!'),
((SELECT id FROM w), 2, 'Crab Walk',       '🦀', 40, 15, 'Belly up, walk sideways.'),
((SELECT id FROM w), 3, 'Bear Crawl',      '🐻', 40, 15, 'Hands and feet only, keep low.'),
((SELECT id FROM w), 4, 'Single-Leg Hop',  '🦩', 30, 10, 'Switch legs halfway.'),
((SELECT id FROM w), 5, 'Ninja Freeze',    '🥷', 20, 10, 'Move, then FREEZE in a cool pose!'),
((SELECT id FROM w), 6, 'Roll & Jump Up',  '🌀', 30, 0,  'Roll on the floor, spring up ready.');

WITH w AS (SELECT id FROM public.workouts WHERE slug = 'stretch-out')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Reach & Bend',      '🌳', 30, 5,  'Reach up tall, bend down slow.'),
((SELECT id FROM w), 2, 'Butterfly Stretch', '🦋', 40, 5,  'Feet together, gentle knee flaps.'),
((SELECT id FROM w), 3, 'Cat-Cow',           '🐱', 40, 5,  'Arch and round your back slowly.'),
((SELECT id FROM w), 4, 'Child''s Pose',     '🧘', 40, 5,  'Big deep breaths.'),
((SELECT id FROM w), 5, 'Deep Breaths',      '💨', 30, 0,  'In through the nose, out through the mouth.');

WITH w AS (SELECT id FROM public.workouts WHERE slug = 'boss-battle')
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, reps, rest_sec, cue) VALUES
((SELECT id FROM w), 1, 'Burpees',        '💣', NULL, 8,  20, 'Down, jump back, jump forward, jump up!'),
((SELECT id FROM w), 2, 'Mountain Climbers','⛰️', 40, NULL, 15, 'Fast knees to chest.'),
((SELECT id FROM w), 3, 'Jump Squats',    '🚀', NULL, 10, 20, 'Squat down, explode UP.'),
((SELECT id FROM w), 4, 'Push-Up Hold',   '💪', 20,   NULL, 15, 'Hold halfway down. Shake if you must.'),
((SELECT id FROM w), 5, 'Plank Jacks',    '🕷️', 30,   NULL, 20, 'Plank + jumping jack legs.'),
((SELECT id FROM w), 6, 'Sprint in Place','🏃', 30,   NULL, 20, 'GO GO GO!'),
((SELECT id FROM w), 7, 'Victory Plank',  '🏆', 45,   NULL, 0,  'Last one. You''re the boss!');
