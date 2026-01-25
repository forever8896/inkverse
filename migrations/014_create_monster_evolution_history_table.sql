-- Migration: 014_create_monster_evolution_history_table.sql
-- Description: Create monster_evolution_history table for tracking all evolutions
-- This serves as an audit log of the NFT's evolution journey

CREATE TABLE IF NOT EXISTS monster_evolution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monster_id UUID NOT NULL REFERENCES user_monsters(id) ON DELETE CASCADE,

  -- Evolution details
  stage VARCHAR(50) NOT NULL,
  milestone_label VARCHAR(255),  -- e.g., "First Contract Compiled"

  -- What was added/changed
  assets_added JSONB,  -- e.g., {"image_cid": "Qm...", "model_cid": "Qm..."}
  metadata_cid VARCHAR(255),  -- Metadata CID after this evolution

  -- Blockchain transaction (for evolutions that update on-chain)
  tx_hash VARCHAR(255),
  block_hash VARCHAR(255),
  block_number BIGINT,

  -- Linked generation job (if assets were generated)
  generation_job_id UUID REFERENCES monster_generations(id) ON DELETE SET NULL,

  -- Lesson context (which lesson triggered this evolution)
  lesson_id INTEGER,
  chapter_id INTEGER,
  step_id INTEGER,

  -- Timestamp
  evolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_evolution_history_monster ON monster_evolution_history(monster_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_stage ON monster_evolution_history(stage);
CREATE INDEX IF NOT EXISTS idx_evolution_history_evolved_at ON monster_evolution_history(evolved_at);
CREATE INDEX IF NOT EXISTS idx_evolution_history_job ON monster_evolution_history(generation_job_id);

-- Add constraint for valid stages
ALTER TABLE monster_evolution_history
ADD CONSTRAINT valid_evolution_stage CHECK (stage IN ('young', 'young_3d', 'adult'));

-- Comments for documentation
COMMENT ON TABLE monster_evolution_history IS 'Audit log of all monster evolutions with assets and blockchain transactions';
COMMENT ON COLUMN monster_evolution_history.milestone_label IS 'Human-readable label shown in evolution timeline';
COMMENT ON COLUMN monster_evolution_history.assets_added IS 'JSON object with CIDs of assets added in this evolution';
COMMENT ON COLUMN monster_evolution_history.metadata_cid IS 'IPFS CID of the NFT metadata after this evolution';
COMMENT ON COLUMN monster_evolution_history.tx_hash IS 'Blockchain transaction hash for on-chain metadata update';
