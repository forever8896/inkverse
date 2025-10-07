-- Migration: Three-tier lesson progress tracking (Lesson → Chapter → Step)
-- File: migrations/006_create_lesson_progress_tables.sql
-- Created: 2025-10-06

BEGIN;

-- ============================================================================
-- User Lesson Progress (Top-level tracking)
-- ============================================================================
CREATE TABLE user_lesson_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    lesson_id INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_chapter_id INTEGER,
    evolution_stage VARCHAR(50) DEFAULT 'egg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

-- ============================================================================
-- User Chapter Progress (Middle-tier tracking)
-- ============================================================================
CREATE TABLE user_chapter_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    lesson_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    current_step_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id, chapter_id)
);

-- ============================================================================
-- User Step Progress (Granular tracking with code snapshots)
-- ============================================================================
CREATE TABLE user_step_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    lesson_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    contract_code TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    attempts INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    validation_passed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id, chapter_id, step_id)
);

-- ============================================================================
-- Generation Triggers (Links lesson completion to NFT generation)
-- ============================================================================
CREATE TABLE lesson_generation_triggers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    lesson_id INTEGER NOT NULL,
    chapter_id INTEGER NOT NULL,
    step_id INTEGER NOT NULL,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generation_job_id UUID,
    completed BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
    FOREIGN KEY (generation_job_id) REFERENCES monster_generations(id) ON DELETE SET NULL,
    UNIQUE(user_id, lesson_id, chapter_id, step_id)
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Lesson progress indexes
CREATE INDEX idx_lesson_progress_user_id ON user_lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON user_lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_user_lesson ON user_lesson_progress(user_id, lesson_id);

-- Chapter progress indexes
CREATE INDEX idx_chapter_progress_user_id ON user_chapter_progress(user_id);
CREATE INDEX idx_chapter_progress_lesson_id ON user_chapter_progress(lesson_id);
CREATE INDEX idx_chapter_progress_user_lesson ON user_chapter_progress(user_id, lesson_id);
CREATE INDEX idx_chapter_progress_user_chapter ON user_chapter_progress(user_id, lesson_id, chapter_id);

-- Step progress indexes
CREATE INDEX idx_step_progress_user_id ON user_step_progress(user_id);
CREATE INDEX idx_step_progress_lesson_id ON user_step_progress(lesson_id);
CREATE INDEX idx_step_progress_user_lesson ON user_step_progress(user_id, lesson_id);
CREATE INDEX idx_step_progress_user_chapter ON user_step_progress(user_id, lesson_id, chapter_id);
CREATE INDEX idx_step_progress_completed ON user_step_progress(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Generation trigger indexes
CREATE INDEX idx_generation_triggers_user_id ON lesson_generation_triggers(user_id);
CREATE INDEX idx_generation_triggers_job_id ON lesson_generation_triggers(generation_job_id);
CREATE INDEX idx_generation_triggers_completed ON lesson_generation_triggers(completed) WHERE completed = FALSE;

-- ============================================================================
-- Triggers for automatic timestamp updates
-- ============================================================================

CREATE TRIGGER update_lesson_progress_updated_at
    BEFORE UPDATE ON user_lesson_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapter_progress_updated_at
    BEFORE UPDATE ON user_chapter_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_step_progress_updated_at
    BEFORE UPDATE ON user_step_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMIT;
