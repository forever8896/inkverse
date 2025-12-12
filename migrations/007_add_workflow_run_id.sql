-- Migration 007: Add workflow_run_id to monster_generations table
-- Purpose: Track Vercel Workflow Run objects for durable execution
-- Author: Workflow Integration Team
-- Date: 2025-11-05

-- Add workflow_run_id column (idempotent)
DO $$ BEGIN
    ALTER TABLE monster_generations ADD COLUMN workflow_run_id VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Create index for fast lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_monster_generations_workflow_run_id
ON monster_generations(workflow_run_id);

-- Add comment
COMMENT ON COLUMN monster_generations.workflow_run_id
IS 'Vercel Workflow Run ID for tracking durable execution state (format: run_<nanoid>)';
