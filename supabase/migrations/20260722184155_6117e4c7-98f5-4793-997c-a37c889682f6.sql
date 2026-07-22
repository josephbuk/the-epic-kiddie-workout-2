
-- Seed workouts
INSERT INTO public.workouts (slug, title, description, focus, duration_min, difficulty, emoji) VALUES
('warm-up-wiggle', 'Warm Up Wiggle', 'Wake up your body with fun moves to get ready.', 'warmup', 5, 'easy', '🌞'),
('jump-start', 'Jump Start', 'Get your heart pumping with jumps and quick feet.', 'cardio', 10, 'medium', '⚡'),
('super-strong', 'Super Strong', 'Build strong muscles with bodyweight power moves.', 'strength', 12, 'medium', '💪'),
('ninja-flow', 'Ninja Flow', 'Move like a ninja — quick, sneaky, and agile.', 'agility', 10, 'medium', '🥷'),
('stretch-out', 'Stretch Out', 'Cool down and stretch tall like a tree.', 'flexibility', 7, 'easy', '🧘'),
('boss-battle', 'Boss Battle', 'The ultimate mix — cardio, strength, and grit!', 'cardio', 15, 'hard', '🔥')
ON CONFLICT (slug) DO NOTHING;

-- Seed exercises
WITH w AS (SELECT id, slug FROM public.workouts)
INSERT INTO public.workout_exercises (workout_id, ord, name, emoji, duration_sec, reps, rest_sec, cue)
SELECT w.id, e.ord, e.name, e.emoji, e.duration_sec, e.reps, e.rest_sec, e.cue
FROM w
JOIN (VALUES
  -- Warm Up Wiggle
  ('warm-up-wiggle', 1, 'Arm Circles', '🌀', 30, NULL, 10, 'Big circles, forward then back!'),
  ('warm-up-wiggle', 2, 'March in Place', '🚶', 45, NULL, 10, 'Lift those knees high!'),
  ('warm-up-wiggle', 3, 'Toe Touches', '👣', 30, NULL, 10, 'Reach for your toes!'),
  ('warm-up-wiggle', 4, 'Shoulder Rolls', '🙆', 30, NULL, 10, 'Roll them slow and smooth.'),
  ('warm-up-wiggle', 5, 'Side Bends', '🤸', 30, NULL, 10, 'Stretch tall like a tree bending in the wind.'),
  -- Jump Start
  ('jump-start', 1, 'Jumping Jacks', '⭐', 40, NULL, 15, 'Star shape — arms up, feet out!'),
  ('jump-start', 2, 'High Knees', '🦵', 30, NULL, 15, 'Fast feet — knees to belly!'),
  ('jump-start', 3, 'Bunny Hops', '🐰', 30, NULL, 15, 'Small quick hops forward.'),
  ('jump-start', 4, 'Skater Jumps', '⛸️', 40, NULL, 15, 'Jump side to side like ice skating.'),
  ('jump-start', 5, 'Butt Kicks', '🍑', 30, NULL, 15, 'Kick your heels to your bum!'),
  ('jump-start', 6, 'Star Jumps', '✨', 30, NULL, 15, 'Explode into a star!'),
  -- Super Strong
  ('super-strong', 1, 'Squats', '🏋️', NULL, 12, 15, 'Sit back like a chair is behind you.'),
  ('super-strong', 2, 'Push Ups (knees OK)', '💥', NULL, 8, 20, 'Keep your body like a plank.'),
  ('super-strong', 3, 'Lunges', '🦿', NULL, 10, 15, 'Big step, drop the back knee.'),
  ('super-strong', 4, 'Plank', '🧱', 30, NULL, 20, 'Straight as a board — no sagging!'),
  ('super-strong', 5, 'Superman', '🦸', 20, NULL, 15, 'Lift arms and legs like flying!'),
  ('super-strong', 6, 'Wall Sit', '🧗', 30, NULL, 15, 'Back on wall, thighs strong!'),
  -- Ninja Flow
  ('ninja-flow', 1, 'Ninja Sneak Walk', '🥷', 30, NULL, 10, 'Silent, low, quick.'),
  ('ninja-flow', 2, 'Side Shuffle', '↔️', 30, NULL, 10, 'Stay low and fast.'),
  ('ninja-flow', 3, 'Crab Walk', '🦀', 30, NULL, 15, 'Belly up, walk sideways!'),
  ('ninja-flow', 4, 'Bear Crawl', '🐻', 30, NULL, 15, 'Hands and feet, hips high.'),
  ('ninja-flow', 5, 'Frog Jumps', '🐸', NULL, 10, 15, 'Big powerful jumps forward.'),
  ('ninja-flow', 6, 'Balance on One Foot', '🦩', 30, NULL, 10, 'Switch feet halfway!'),
  -- Stretch Out
  ('stretch-out', 1, 'Reach to the Sky', '☁️', 30, NULL, 10, 'Grow tall!'),
  ('stretch-out', 2, 'Forward Fold', '🙇', 30, NULL, 10, 'Let your arms hang like noodles.'),
  ('stretch-out', 3, 'Butterfly Stretch', '🦋', 40, NULL, 10, 'Feet together, flap knees gently.'),
  ('stretch-out', 4, 'Cat & Cow', '🐱', 40, NULL, 10, 'Arch and round your back.'),
  ('stretch-out', 5, 'Child''s Pose', '🧘', 45, NULL, 10, 'Rest and breathe deep.'),
  -- Boss Battle
  ('boss-battle', 1, 'Jumping Jacks', '⭐', 45, NULL, 15, 'Warm up the engines!'),
  ('boss-battle', 2, 'Burpees', '🔥', NULL, 8, 20, 'Down, plank, jump up!'),
  ('boss-battle', 3, 'Mountain Climbers', '⛰️', 40, NULL, 15, 'Run in a plank!'),
  ('boss-battle', 4, 'Squat Jumps', '🚀', NULL, 12, 20, 'Squat, then blast off!'),
  ('boss-battle', 5, 'Push Ups', '💥', NULL, 10, 20, 'Chest to floor!'),
  ('boss-battle', 6, 'Plank Hold', '🧱', 45, NULL, 20, 'Hold strong — you got this!'),
  ('boss-battle', 7, 'High Knees', '🦵', 40, NULL, 15, 'Sprint in place!'),
  ('boss-battle', 8, 'Victory Pose', '🏆', 15, NULL, 0, 'You beat the boss!')
) AS e(slug, ord, name, emoji, duration_sec, reps, rest_sec, cue) ON w.slug = e.slug;
