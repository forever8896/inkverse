-- Migration: 013_create_user_monsters_table.sql
-- Description: Create user_monsters table for the NFT Evolution System
-- This table links each user to their single evolving monster NFT

-- Create user_monsters table
CREATE TABLE IF NOT EXISTS user_monsters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Current evolution state
  current_stage VARCHAR(50) NOT NULL DEFAULT 'young',

  -- NFT identifiers (set after first mint)
  nft_item_id INTEGER,
  nft_collection_id INTEGER DEFAULT 11,
  nft_owner_address VARCHAR(255),

  -- Latest metadata CID (updated on each evolution)
  current_metadata_cid VARCHAR(255),

  -- Asset references (S3 keys for all generated assets)
  young_image_s3_key VARCHAR(500),
  young_model_s3_key VARCHAR(500),
  adult_model_s3_key VARCHAR(500),

  -- IPFS CIDs (set when uploaded during evolution)
  young_image_cid VARCHAR(255),
  young_model_cid VARCHAR(255),
  adult_model_cid VARCHAR(255),

  -- Generation prompt data (for continuity)
  generation_prompt TEXT,
  generation_style VARCHAR(50),

  -- Monster attributes (stored for evolution consistency)
  attributes JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_user_monster UNIQUE(user_id),  -- One monster per user
  CONSTRAINT unique_nft UNIQUE(nft_collection_id, nft_item_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_monsters_user ON user_monsters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_monsters_nft ON user_monsters(nft_collection_id, nft_item_id);
CREATE INDEX IF NOT EXISTS idx_user_monsters_stage ON user_monsters(current_stage);
CREATE INDEX IF NOT EXISTS idx_user_monsters_created ON user_monsters(created_at);

-- Add constraint for valid stages
ALTER TABLE user_monsters
ADD CONSTRAINT valid_stage CHECK (current_stage IN ('young', 'young_3d', 'adult'));

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_monsters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_monsters_updated_at_trigger
  BEFORE UPDATE ON user_monsters
  FOR EACH ROW
  EXECUTE FUNCTION update_user_monsters_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_monsters IS 'Links users to their single evolving monster NFT. One monster per user.';
COMMENT ON COLUMN user_monsters.current_stage IS 'Current evolution stage: young, young_3d, or adult';
COMMENT ON COLUMN user_monsters.nft_item_id IS 'NFT token ID on-chain (set after first mint)';
COMMENT ON COLUMN user_monsters.current_metadata_cid IS 'Current IPFS CID for NFT metadata (updated on each evolution)';
COMMENT ON COLUMN user_monsters.young_model_s3_key IS '3D model S3 key generated at young stage (revealed at young_3d)';
COMMENT ON COLUMN user_monsters.attributes IS 'Monster attributes stored as JSON for consistency across evolutions';
