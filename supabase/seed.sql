-- INSTRUCTIONS:
-- 1. Copy everything below this line.
-- 2. Go to your Supabase Dashboard -> SQL Editor.
-- 3. Paste this in and click "Run" to update the live system.
------------------------------------------------------------------

-- 1. Drop the old table to replace it with the correct structure
DROP TABLE IF EXISTS exercises CASCADE;

-- 2. Create the exercises table with the exact columns your page expects
CREATE TABLE exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    block_type TEXT NOT NULL CHECK (block_type IN ('Activation', 'Movement', 'Strength')),
    modality TEXT DEFAULT 'Bodyweight',
    tracking_unit TEXT DEFAULT 'reps'
);

-- 3. Insert matching data with correct block_types, tracking units, and modalities
INSERT INTO exercises (name, block_type, modality, tracking_unit) VALUES
-- Activation
('World Greatest Stretch', 'Activation', 'Mobility', 'reps'),
('90/90 Hip Flow', 'Activation', 'Mobility', 'reps'),
('Band Pull-Aparts', 'Activation', 'Bands', 'reps'),

-- Movement
('A-Skips', 'Movement', 'Speed', 'distance'),
('Lateral Bounds', 'Movement', 'Plyo', 'reps'),
('Medicine Ball Slams', 'Movement', 'Power', 'reps'),

-- Strength
('Barbell Back Squat', 'Strength', 'Barbell', 'lbs'),
('Dumbbell Bench Press', 'Strength', 'Dumbbell', 'lbs'),
('Romanian Deadlift', 'Strength', 'Barbell', 'lbs');
