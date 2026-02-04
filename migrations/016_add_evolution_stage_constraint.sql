-- Migration 016: Add CHECK constraint for evolution_stage column
-- Ensures only valid evolution stages are stored in the database

-- First, fix any existing invalid values
UPDATE user_lesson_progress
SET evolution_stage = 'egg'
WHERE evolution_stage NOT IN ('egg', 'young', 'young_3d', 'adult');

-- Add CHECK constraint to enforce valid values
ALTER TABLE user_lesson_progress
ADD CONSTRAINT valid_evolution_stage
CHECK (evolution_stage IN ('egg', 'young', 'young_3d', 'adult'));
