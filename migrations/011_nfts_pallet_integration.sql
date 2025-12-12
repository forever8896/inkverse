-- NFT Minting Integration Migration
-- Adds wallet support to users and NFT tracking to monster_generations

-- 1. Add wallet_address to user table
ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS wallet_address TEXT;

CREATE INDEX IF NOT EXISTS idx_user_wallet_address
  ON "user"(wallet_address) WHERE wallet_address IS NOT NULL;

-- 2. Add NFT columns to monster_generations
ALTER TABLE monster_generations
  ADD COLUMN IF NOT EXISTS nft_item_id INTEGER,
  ADD COLUMN IF NOT EXISTS nft_collection_id INTEGER,
  ADD COLUMN IF NOT EXISTS nft_metadata_cid TEXT,
  ADD COLUMN IF NOT EXISTS nft_image_cid TEXT,
  ADD COLUMN IF NOT EXISTS nft_model_cid TEXT,
  ADD COLUMN IF NOT EXISTS nft_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS nft_block_hash TEXT,
  ADD COLUMN IF NOT EXISTS nft_minted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nft_owner_address TEXT;

-- Indexes for NFT lookups
CREATE INDEX IF NOT EXISTS idx_monster_generations_nft_item_id
  ON monster_generations(nft_item_id) WHERE nft_item_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monster_generations_nft_owner
  ON monster_generations(nft_owner_address) WHERE nft_owner_address IS NOT NULL;

-- Unique constraint to prevent duplicate collection+item combinations
-- This guards against race conditions or bugs that might try to assign
-- the same NFT ID to multiple jobs
ALTER TABLE monster_generations
ADD CONSTRAINT uq_nft_collection_item
UNIQUE (nft_collection_id, nft_item_id);

-- 3. Add new generation statuses
DO $$ BEGIN
  ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'checking_prerequisites';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'prerequisites_failed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'minting_nft';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'nft_minting_retrying';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE generation_status ADD VALUE IF NOT EXISTS 'nft_minting_failed';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. NFT item ID counter table
CREATE TABLE IF NOT EXISTS nft_collection_state (
  collection_id INTEGER PRIMARY KEY,
  next_item_id INTEGER NOT NULL DEFAULT 0,
  total_minted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize with collection ID 11 (created on Paseo Asset Hub)
INSERT INTO nft_collection_state (collection_id, next_item_id, total_minted)
VALUES (11, 0, 0)
ON CONFLICT (collection_id) DO NOTHING;

-- 5. Atomic function to allocate next NFT item ID
CREATE OR REPLACE FUNCTION get_next_nft_item_id(p_collection_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_next_id INTEGER;
BEGIN
  UPDATE nft_collection_state
  SET next_item_id = next_item_id + 1,
      total_minted = total_minted + 1,
      updated_at = NOW()
  WHERE collection_id = p_collection_id
  RETURNING next_item_id - 1 INTO v_next_id;

  IF v_next_id IS NULL THEN
    RAISE EXCEPTION 'Collection % not found in nft_collection_state', p_collection_id;
  END IF;

  RETURN v_next_id;
END;
$$ LANGUAGE plpgsql;
