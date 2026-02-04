-- Migration: Add rigging fields to monster_generations table
-- Enables Tripo AI rigging and animation for 3D models

-- Add Tripo import tracking columns
ALTER TABLE monster_generations
  ADD COLUMN IF NOT EXISTS tripo_import_task_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tripo_import_status VARCHAR(50) DEFAULT NULL;

-- Add rigging fields
ALTER TABLE monster_generations
  ADD COLUMN IF NOT EXISTS rigging_status VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rigging_task_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rig_check_task_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rig_type VARCHAR(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rigged_glb_s3_key VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rigged_glb_url TEXT DEFAULT NULL;

-- Add animation fields
ALTER TABLE monster_generations
  ADD COLUMN IF NOT EXISTS animation_task_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS animation_preset VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS animated_glb_s3_key VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS animated_glb_url TEXT DEFAULT NULL;

-- Add cost and timestamp fields
ALTER TABLE monster_generations
  ADD COLUMN IF NOT EXISTS tripo_estimated_cost DECIMAL(10, 6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rigging_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS rigging_completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create indexes for rigging queries
CREATE INDEX IF NOT EXISTS idx_monster_generations_rigging_status
  ON monster_generations(rigging_status) WHERE rigging_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monster_generations_tripo_import
  ON monster_generations(tripo_import_status) WHERE tripo_import_status IS NOT NULL;

-- Create composite index for riggable job queries (completed with GLB)
CREATE INDEX IF NOT EXISTS idx_monster_generations_riggable
  ON monster_generations(status, glb_s3_key)
  WHERE status = 'completed' AND glb_s3_key IS NOT NULL;

COMMENT ON COLUMN monster_generations.tripo_import_task_id IS 'Task ID from Tripo import_model operation';
COMMENT ON COLUMN monster_generations.tripo_import_status IS 'Status: null, importing, imported, import_failed';
COMMENT ON COLUMN monster_generations.rigging_status IS 'Status: null, checking, riggable, not_riggable, rigging, rigged, rig_failed, animating, animated, animation_failed';
COMMENT ON COLUMN monster_generations.rigging_task_id IS 'Task ID from Tripo animate_rig operation';
COMMENT ON COLUMN monster_generations.rig_check_task_id IS 'Task ID from Tripo animate_prerigcheck operation';
COMMENT ON COLUMN monster_generations.rig_type IS 'Detected rig type: biped, quadruped, hexapod, octopod, avian, serpentine, aquatic';
COMMENT ON COLUMN monster_generations.rigged_glb_s3_key IS 'S3 key for the rigged GLB model';
COMMENT ON COLUMN monster_generations.rigged_glb_url IS 'Presigned URL for the rigged GLB model';
COMMENT ON COLUMN monster_generations.animation_task_id IS 'Task ID from Tripo animate_retarget operation';
COMMENT ON COLUMN monster_generations.animation_preset IS 'Animation preset applied (e.g., preset:walk, preset:idle)';
COMMENT ON COLUMN monster_generations.animated_glb_s3_key IS 'S3 key for the animated GLB model';
COMMENT ON COLUMN monster_generations.animated_glb_url IS 'Presigned URL for the animated GLB model';
COMMENT ON COLUMN monster_generations.tripo_estimated_cost IS 'Estimated cost for Tripo rigging operations in USD';
