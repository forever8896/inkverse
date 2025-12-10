# Progress Tracking API Guide

## Overview

The MonstersInk! progress tracking system implements a three-tier architecture: **Lesson → Chapter → Step**. This allows fine-grained tracking of user progress while maintaining flexibility for NFT generation triggers.

## Database Schema

### Tables Created (Migration 006)

1. **`user_lesson_progress`** - Top-level lesson tracking
2. **`user_chapter_progress`** - Chapter-level tracking
3. **`user_step_progress`** - Granular step tracking with code snapshots
4. **`lesson_generation_triggers`** - Links lesson completion to NFT generation

See: `/migrations/006_create_lesson_progress_tables.sql`

## API Endpoints

### 1. Overall Progress

**`GET /api/progress`**

Get user's complete progress across all lessons.

**Response:**
```json
{
  "lessonProgress": [
    {
      "lesson_id": 1,
      "started_at": "2025-10-06T...",
      "completed_at": null,
      "current_chapter_id": 3,
      "evolution_stage": "egg"
    }
  ],
  "chapterProgress": [...],
  "currentPosition": {
    "lesson_id": 1,
    "chapter_id": 3,
    "step_id": 7
  }
}
```

---

### 2. Step Progress

**`POST /api/progress/step`**

Save progress for a specific step (auto-save on each step completion).

**Request:**
```json
{
  "lessonId": 1,
  "chapterId": 3,
  "stepId": 7,
  "contractCode": "#![cfg_attr...]]",
  "completed": true,
  "validationPassed": true
}
```

**Response:**
```json
{
  "success": true,
  "progress": {
    "id": "uuid",
    "user_id": "user-id",
    "lesson_id": 1,
    "chapter_id": 3,
    "step_id": 7,
    "contract_code": "...",
    "completed_at": "2025-10-06T...",
    "attempts": 3,
    "validation_passed": true
  }
}
```

**`GET /api/progress/step?lessonId=1&chapterId=3&stepId=7`**

Retrieve progress for a specific step.

---

### 3. Chapter Progress

**`POST /api/progress/chapter`**

Mark a chapter as completed.

**Request:**
```json
{
  "lessonId": 1,
  "chapterId": 3
}
```

**`GET /api/progress/chapter?lessonId=1&chapterId=3`**

Get chapter progress with all steps.

**Response:**
```json
{
  "chapter": {
    "lesson_id": 1,
    "chapter_id": 3,
    "completed_at": "2025-10-06T...",
    "current_step_id": 8
  },
  "steps": [...]
}
```

---

### 4. Lesson Progress

**`POST /api/progress/lesson`**

Mark a lesson as completed.

**Request:**
```json
{
  "lessonId": 1,
  "evolutionStage": "creature"
}
```

**`GET /api/progress/lesson?lessonId=1`**

Get complete lesson progress (all chapters and steps).

**Response:**
```json
{
  "lesson": {
    "lesson_id": 1,
    "completed_at": "2025-10-06T...",
    "evolution_stage": "creature"
  },
  "chapters": [...],
  "steps": [...]
}
```

---

### 5. Generation Triggers

**`POST /api/progress/trigger-generation`**

Trigger NFT generation for a step with `triggersGeneration: true`.

**Request:**
```json
{
  "lessonId": 1,
  "chapterId": 5,
  "stepId": 12,
  "generationJobId": "uuid-of-monster-generation-job"
}
```

**Response:**
```json
{
  "success": true,
  "trigger": {
    "id": "uuid",
    "user_id": "user-id",
    "lesson_id": 1,
    "chapter_id": 5,
    "step_id": 12,
    "generation_job_id": "uuid",
    "triggered_at": "2025-10-06T...",
    "completed": false
  }
}
```

**`GET /api/progress/trigger-generation?lessonId=1&chapterId=5&stepId=12`**

Check if generation has been triggered for a step.

**Response:**
```json
{
  "triggered": true,
  "trigger": {
    "id": "uuid",
    "generation_status": "completed",
    "image_url": "https://...",
    "glb_url": "https://...",
    "generation_progress": 100
  }
}
```

**`PATCH /api/progress/trigger-generation`**

Update generation trigger (link job ID or mark completed).

**Request:**
```json
{
  "lessonId": 1,
  "chapterId": 5,
  "stepId": 12,
  "generationJobId": "uuid",
  "completed": true
}
```

---

## Generation Control

### Where NFT Generation Kicks In

The `triggersGeneration` field in the Step schema controls when NFT generation is offered.

**Lesson 1 Structure:**

| Chapter | Steps | Generation Trigger? |
|---------|-------|---------------------|
| 1. Understanding Smart Contracts | 2 | ❌ No |
| 2. Building the Contract Structure | 2 | ❌ No |
| 3. Adding Contract Functions | 4 | ❌ No |
| 4. Compilation & Deployment | 3 | ❌ No |
| 5. Bring Your Creature to Life! | 1 | ✅ **YES** (Step 12) |

**Step 12 Configuration:**
```json
{
  "id": 12,
  "chapterId": 5,
  "title": "🎨 Generate Your Creature NFT",
  "triggersGeneration": true,
  "content": "... shows cost warning and generation button ..."
}
```

### Flow for NFT Generation

1. **User completes Step 12** (final step of Lesson 1)
2. **Frontend shows generation modal** with cost warning (~$0.70)
3. **User clicks "Generate My Creature"**
4. **Frontend calls:**
   - `POST /api/generate-monster` with `{ lessonId, chapterId, stepId, ...monsterParams }`
   - Server atomically creates job AND links it to the lesson step via `createWithTrigger()`
   - Returns `{ jobId, runId, resumed: true/false }`
5. **Frontend polls** `/api/monster-status/[jobId]` until completion
6. **On completion:** NFT minted and user can view their creature

> **Note:** The separate `POST /api/progress/trigger-generation` endpoint is only used
> for manual admin operations, direct API access, or legacy code paths. The primary
> flow uses the atomic `POST /api/generate-monster` endpoint which handles both
> job creation and trigger linking in a single database transaction.

---

## Usage Example (Frontend)

```typescript
// Save step progress on each step completion
async function saveStepProgress(
  lessonId: number,
  chapterId: number,
  stepId: number,
  code: string,
  completed: boolean
) {
  const response = await fetch('/api/progress/step', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessonId,
      chapterId,
      stepId,
      contractCode: code,
      completed,
      validationPassed: true,
    }),
  });

  return response.json();
}

// Check if generation already triggered
async function checkGenerationTriggered(
  lessonId: number,
  chapterId: number,
  stepId: number
) {
  const params = new URLSearchParams({ lessonId, chapterId, stepId });
  const response = await fetch(`/api/progress/trigger-generation?${params}`);
  const data = await response.json();

  return data.triggered; // true if already generated
}

// Trigger NFT generation - NEW ATOMIC FLOW
async function triggerGeneration(
  lessonId: number,
  chapterId: number,
  stepId: number,
  monsterParams: any
) {
  const response = await fetch('/api/generate-monster', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lessonId,
      chapterId,
      stepId,
      ...monsterParams
    }),
  });

  return response.json(); // Returns { jobId, resumed: boolean }
}
```

---

## Migration Instructions

### 1. Run Database Migration

```bash
# Apply the migration to your PostgreSQL database
psql $POSTGRES_URL -f migrations/006_create_lesson_progress_tables.sql
```

### 2. Update Lesson Content

The new lesson format is in `/src/content/lessons/lesson-1.json` with the three-tier structure.

### 3. Frontend Integration

Update lesson UI components to:
- Navigate through Chapters and Steps
- Auto-save progress on step completion
- Show generation button only when `triggersGeneration: true`
- Check if generation already triggered before showing button

---

## Benefits of Three-Tier System

1. **Granular Progress Tracking** - Know exactly where users are in each lesson
2. **Flexible NFT Triggers** - Control generation at any step/chapter completion
3. **Resume Experience** - Users can pick up exactly where they left off
4. **Code Snapshots** - Save user's contract code at each step for debugging
5. **Analytics** - Track which steps users struggle with (high `attempts` count)
6. **One Generation Per Lesson** - Prevent duplicate NFT generation attempts

---

## Security Notes

- All endpoints require authentication via Better Auth
- User can only access/modify their own progress
- Generation triggers are one-time only (409 error if already triggered)
- Database transactions ensure data consistency