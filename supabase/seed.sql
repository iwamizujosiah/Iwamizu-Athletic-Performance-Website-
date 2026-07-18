-- 1. -- 1. Create the exercises table if it doesn't exist yet
CREATE TABLE IF NOT EXISTS exercises (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Activation', 'Movement', 'Strength'))
);

-- 2. Clear out any old data to prevent duplicates
TRUNCATE TABLE exercises;

-- 3. Insert the curriculum data into your database
INSERT INTO exercises (name, category) VALUES
('World Greatest Stretch', 'Activation'),
('90/90 Hip Flow', 'Activation'),
('Band Pull-Aparts', 'Activation'),
('A-Skips', 'Movement'),
('Lateral Bounds', 'Movement'),
('Medicine Ball Slams', 'Movement'),
('Barbell Back Squat', 'Strength'),
('Dumbbell Bench Press', 'Strength'),
('Romanian Deadlift', 'Strength');
