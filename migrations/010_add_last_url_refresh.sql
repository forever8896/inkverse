-- Add last_url_refresh timestamp to track presigned URL freshness independently of updatedAt
ALTER TABLE monster_generations
ADD COLUMN IF NOT EXISTS last_url_refresh TIMESTAMP WITH TIME ZONE DEFAULT NOW();
