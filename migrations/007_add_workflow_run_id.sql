-- Migration 007: Add workflow_run_id to monster_generations table
-- Purpose: Track Vercel Workflow Run objects for durable execution
-- Author: Workflow Integration Team
-- Date: 2025-11-05

-- Add workflow_run_id column
ALTER TABLE monster_generations
ADD COLUMN workflow_run_id VARCHAR(255);

-- Create index for fast lookups
CREATE INDEX idx_monster_generations_workflow_run_id
ON monster_generations(workflow_run_id);

-- Add comment
COMMENT ON COLUMN monster_generations.workflow_run_id
IS 'Vercel Workflow Run ID for tracking durable execution state (format: run_<nanoid>)';

-- Verify migration
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'monster_generations'
  AND column_name = 'workflow_run_id';
