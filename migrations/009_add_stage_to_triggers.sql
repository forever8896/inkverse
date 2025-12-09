-- Add stage column to track which evolution stage was triggered
ALTER TABLE lesson_generation_triggers
ADD COLUMN IF NOT EXISTS stage VARCHAR(20);

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_triggers_user_lesson_stage
ON lesson_generation_triggers(user_id, lesson_id, stage);
