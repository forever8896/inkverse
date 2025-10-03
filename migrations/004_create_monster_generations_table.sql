-- Custom enum types for monster generations
CREATE TYPE monster_style AS ENUM ('cute', 'fierce', 'mysterious', 'playful', 'cosmic');
CREATE TYPE monster_stage AS ENUM ('egg', 'young', 'adult');
CREATE TYPE generation_type AS ENUM ('full', 'image_only');
CREATE TYPE generation_status AS ENUM (
    'pending',
    'generating_image',
    'converting_3d',
    'completed',
    'failed',
    'image_generation_failed',
    'image_generation_retrying',
    'conversion_failed',
    'conversion_retrying',
    'failed_permanent',
    'waiting_on_storage'
);

-- Trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if the column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = TG_TABLE_NAME
        AND column_name = 'updated_at'
    ) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Monster generations table
CREATE TABLE monster_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    style monster_style NOT NULL,
    stage monster_stage NOT NULL,
    generation_type generation_type NOT NULL DEFAULT 'full',
    status generation_status NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    image_s3_key TEXT,
    image_url TEXT,
    glb_s3_key TEXT,
    glb_url TEXT,
    total_cost NUMERIC(10,4) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    user_message TEXT,
    retry_count INTEGER DEFAULT 0,
    last_error JSONB,
    openai_text_tokens INTEGER DEFAULT 0,
    openai_image_tokens INTEGER DEFAULT 0,
    openai_total_tokens INTEGER DEFAULT 0,
    openai_estimated_cost NUMERIC(10,6) DEFAULT 0.000000,
    fal_estimated_cost NUMERIC(10,6) DEFAULT 0.000000,
    cost_calculation_method VARCHAR(50) DEFAULT 'token_based',
    last_cost_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    CONSTRAINT monster_generations_progress_check CHECK (progress >= 0 AND progress <= 100)
);

-- Indexes for monster_generations table
CREATE INDEX idx_monster_generations_user_id ON monster_generations(user_id);
CREATE INDEX idx_monster_generations_status ON monster_generations(status);
CREATE INDEX idx_monster_generations_user_status ON monster_generations(user_id, status);
CREATE INDEX idx_monster_generations_created_at ON monster_generations(created_at DESC);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_monster_generations_updated_at
    BEFORE UPDATE ON monster_generations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
