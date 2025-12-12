-- Migration 008: Add unique constraint for active jobs
-- Purpose: Prevent duplicate generation jobs per user (browser refresh protection)
-- Author: Workflow Integration Team
-- Date: 2025-11-05

-- Prevent duplicate active jobs per user (idempotent)
-- This is the strongest layer of duplicate prevention
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_job_per_user
ON monster_generations (user_id)
WHERE status IN (
  'pending',
  'generating_image',
  'converting_3d',
  'image_generation_retrying',
  'conversion_retrying'
);

-- Add comment (idempotent - PostgreSQL ignores duplicate comments)
COMMENT ON INDEX idx_unique_active_job_per_user
IS 'Ensures only one active generation job per user at a time (prevents browser refresh duplicates)';
