-- Migration: 015_add_evolution_fields_to_monster_generations.sql
-- Description: Add evolution-related fields to monster_generations table
-- Links generation jobs to user_monsters and tracks evolution type

-- Add link to user_monsters
ALTER TABLE monster_generations
ADD COLUMN IF NOT EXISTS monster_id UUID REFERENCES user_monsters(id) ON DELETE SET NULL;

-- Add flag to indicate if this generation mints or evolves
ALTER TABLE monster_generations
ADD COLUMN IF NOT EXISTS evolution_type VARCHAR(20) DEFAULT 'mint';

-- Add evolution milestone for history tracking
ALTER TABLE monster_generations
ADD COLUMN IF NOT EXISTS evolution_milestone VARCHAR(255);

-- Add constraint for valid evolution types
ALTER TABLE monster_generations
ADD CONSTRAINT valid_evolution_type CHECK (evolution_type IN ('mint', 'reveal', 'generate_evolve'));

-- Create index for monster_id lookups
CREATE INDEX IF NOT EXISTS idx_monster_generations_monster ON monster_generations(monster_id);
CREATE INDEX IF NOT EXISTS idx_monster_generations_evolution_type ON monster_generations(evolution_type);

-- Comments for documentation
COMMENT ON COLUMN monster_generations.monster_id IS 'Links to user_monsters for evolution tracking';
COMMENT ON COLUMN monster_generations.evolution_type IS 'mint=first NFT, reveal=show existing asset, generate_evolve=new generation + evolve';
COMMENT ON COLUMN monster_generations.evolution_milestone IS 'Human-readable milestone label for evolution history';
