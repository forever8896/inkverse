# API Schema Changes for Contract Evolution

## Overview

This document outlines the specific API and schema changes required to implement the Contract Evolution System. All changes are designed to be backward compatible with existing lesson content while enabling the new evolution features.

## Type System Changes

### Core Type Definitions

#### `/src/lib/lesson-types.ts`

**Enhanced ValidationRule Interface:**
```typescript
export interface ValidationRule {
  type: 'includes' | 'excludes' | 'regex' | 'custom' | 'contract_builds' | 'test_passes';
  patterns: string[];
  message?: string;
  severity?: 'error' | 'warning' | 'info';           // NEW: Validation severity levels
}
```

**New ContractEvolution Interface:**
```typescript
export interface ContractEvolution {
  stage: string;                    // Evolution stage: "egg", "creature", "monster", etc.
  newFeatures: string[];           // Array of new features being introduced
  visualAssets?: string[];         // Associated visual evolution assets
  contractBase?: string;           // Starting contract code (optional override)
  complexity: 'foundation' | 'feature' | 'evolution' | 'mastery';
  evolutionTrigger?: {
    type: 'completion' | 'validation' | 'authentication';
    generateArt?: boolean;         // Whether to trigger AI art generation
    artPrompts?: string[];         // Custom AI generation prompts
    costWarning?: boolean;         // Show cost warning before generation
  };
}
```

**Enhanced LessonStep Interface:**
```typescript
export interface LessonStep {
  // EXISTING FIELDS (unchanged)
  id: number;
  title: string;
  content: string;
  code?: string;
  expectedCode?: string;
  hint?: string;
  validation?: ValidationRule[];
  image?: string;
  requiresAuth?: boolean;
  
  // NEW FIELDS for contract evolution
  contractEvolution?: ContractEvolution;
  buildsOnStep?: number;           // References previous step's contract by ID
  triggersGeneration?: boolean;    // Whether completing this step triggers AI generation
  
  // NEW FIELDS for enhanced learning experience
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTime?: number;          // Estimated completion time in minutes
  prerequisites?: string[];        // Required concepts or previous steps
  codeTemplate?: string;           // Alternative to `code` for template-based steps
  successCriteria?: string[];      // Clear success criteria for step completion
}
```

**Enhanced Lesson Interface:**
```typescript
export interface Lesson {
  // EXISTING FIELDS (unchanged)
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  objectives: string[];
  steps: LessonStep[];
  completed: boolean;
  locked: boolean;
  
  // NEW FIELDS for evolution tracking
  evolutionPath?: {
    startStage: string;            // What creature stage this lesson starts with
    endStage: string;              // What creature stage this lesson ends with
    majorEvolution: boolean;       // Whether this lesson triggers major visual change
  };
  
  // NEW FIELDS for lesson dependencies
  requiresCompletion?: number[];   // Lesson IDs that must be completed first
  contractContinuity?: {
    inheritsFrom?: number;         // Lesson ID this builds contract from
    provides?: string[];           // Contract features this lesson provides to future lessons
  };
  
  // NEW FIELDS for enhanced metadata
  tags?: string[];                 // Searchable tags for lesson content
  estimatedCost?: number;          // Estimated AI generation cost in USD
  communityContent?: boolean;      // Whether this is community-contributed content
}
```

### Database Schema Changes

#### User Progress Tracking

**New Table: `user_evolution_progress`**
```sql
CREATE TABLE user_evolution_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  step_id INTEGER NOT NULL,
  evolution_stage VARCHAR(50) NOT NULL,
  contract_code TEXT,
  visual_assets JSONB DEFAULT '[]',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id, step_id)
);

CREATE INDEX idx_user_evolution_progress_user_id ON user_evolution_progress(user_id);
CREATE INDEX idx_user_evolution_progress_evolution_stage ON user_evolution_progress(evolution_stage);
```

**New Table: `contract_evolution_templates`**
```sql
CREATE TABLE contract_evolution_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id INTEGER NOT NULL,
  step_id INTEGER NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  contract_code TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(lesson_id, step_id, template_name)
);
```

**Enhanced Table: `lesson_completions`**
```sql
-- Add new columns to existing table
ALTER TABLE lesson_completions ADD COLUMN IF NOT EXISTS evolution_data JSONB DEFAULT '{}';
ALTER TABLE lesson_completions ADD COLUMN IF NOT EXISTS final_contract_code TEXT;
ALTER TABLE lesson_completions ADD COLUMN IF NOT EXISTS generation_triggered BOOLEAN DEFAULT FALSE;
```

### API Endpoint Changes

#### Enhanced Lesson Endpoints

**GET `/api/lessons/[id]`**
```typescript
// Enhanced response includes evolution metadata
interface LessonResponse {
  lesson: Lesson;                    // Enhanced with evolution fields
  userProgress?: {
    currentStep: number;
    evolutionStage: string;
    contractCode?: string;
    visualAssets: string[];
  };
  prerequisites?: {
    requiredLessons: number[];
    missingLessons: number[];
  };
}
```

**POST `/api/lessons/[id]/steps/[stepId]/validate`**
```typescript
interface ValidateStepRequest {
  code: string;
  previousCode?: string;             // NEW: For evolution validation
  evolutionContext?: {               // NEW: Evolution context
    stage: string;
    expectedFeatures: string[];
  };
}

interface ValidateStepResponse {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  evolutionValidation?: {            // NEW: Evolution-specific validation
    backward_compatible: boolean;
    new_features_present: boolean;
    evolution_errors: string[];
  };
  shouldTriggerGeneration?: boolean; // NEW: Whether to offer AI generation
}
```

#### New Evolution Endpoints

**GET `/api/evolution/[userId]/progress`**
```typescript
interface EvolutionProgressResponse {
  currentStage: string;
  completedLessons: number[];
  currentLesson: number;
  currentStep: number;
  visualAssets: string[];
  contractHistory: Array<{
    lessonId: number;
    stepId: number;
    code: string;
    timestamp: string;
  }>;
}
```

**POST `/api/evolution/[userId]/generate`**
```typescript
interface GenerateEvolutionRequest {
  lessonId: number;
  stepId: number;
  contractCode: string;
  stage: string;
  customPrompts?: string[];
}

interface GenerateEvolutionResponse {
  success: boolean;
  generationId?: string;
  estimatedCost?: number;
  assetsGenerated?: string[];
  error?: string;
}
```

**GET `/api/evolution/templates/[lessonId]/[stepId]`**
```typescript
interface ContractTemplateResponse {
  templateCode: string;
  features: string[];
  buildsOn?: {
    lessonId: number;
    stepId: number;
  };
  evolutionStage: string;
}
```

### Configuration Schema

#### Lesson Content JSON Schema

**Enhanced lesson JSON structure:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "difficulty": { 
      "type": "string", 
      "enum": ["Beginner", "Intermediate", "Advanced", "Expert"] 
    },
    "duration": { "type": "string" },
    "objectives": { 
      "type": "array", 
      "items": { "type": "string" } 
    },
    "evolutionPath": {
      "type": "object",
      "properties": {
        "startStage": { "type": "string" },
        "endStage": { "type": "string" },
        "majorEvolution": { "type": "boolean" }
      }
    },
    "contractContinuity": {
      "type": "object",
      "properties": {
        "inheritsFrom": { "type": "number" },
        "provides": { 
          "type": "array", 
          "items": { "type": "string" } 
        }
      }
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "number" },
          "title": { "type": "string" },
          "content": { "type": "string" },
          "contractEvolution": {
            "type": "object",
            "properties": {
              "stage": { "type": "string" },
              "newFeatures": { 
                "type": "array", 
                "items": { "type": "string" } 
              },
              "complexity": { 
                "type": "string", 
                "enum": ["foundation", "feature", "evolution", "mastery"] 
              },
              "evolutionTrigger": {
                "type": "object",
                "properties": {
                  "type": { 
                    "type": "string", 
                    "enum": ["completion", "validation", "authentication"] 
                  },
                  "generateArt": { "type": "boolean" },
                  "artPrompts": { 
                    "type": "array", 
                    "items": { "type": "string" } 
                  }
                }
              }
            }
          },
          "buildsOnStep": { "type": "number" },
          "triggersGeneration": { "type": "boolean" }
        }
      }
    }
  }
}
```

## Environment Configuration

### New Environment Variables

```bash
# Contract Evolution Settings
EVOLUTION_GENERATION_ENABLED=true
EVOLUTION_COST_WARNING_THRESHOLD=0.50
EVOLUTION_MAX_RETRIES=3

# Template Storage
CONTRACT_TEMPLATES_CACHE_TTL=3600
EVOLUTION_ASSETS_CDN_URL=https://cdn.monstersink.com/evolution

# Database
EVOLUTION_DB_POOL_SIZE=10
EVOLUTION_DB_TIMEOUT=30000
```

### Feature Flags

```typescript
// /src/lib/feature-flags.ts
export const FeatureFlags = {
  CONTRACT_EVOLUTION: process.env.EVOLUTION_GENERATION_ENABLED === 'true',
  COST_WARNINGS: process.env.EVOLUTION_COST_WARNING_THRESHOLD !== undefined,
  TEMPLATE_CACHING: process.env.CONTRACT_TEMPLATES_CACHE_TTL !== undefined,
  COMMUNITY_CONTENT: process.env.COMMUNITY_CONTENT_ENABLED === 'true',
} as const;
```

## Migration Scripts

### Database Migration

```sql
-- Migration: Add contract evolution support
-- File: migrations/20241006_add_contract_evolution.sql

BEGIN;

-- Create evolution progress table
CREATE TABLE user_evolution_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id INTEGER NOT NULL,
  step_id INTEGER NOT NULL,
  evolution_stage VARCHAR(50) NOT NULL,
  contract_code TEXT,
  visual_assets JSONB DEFAULT '[]',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(user_id, lesson_id, step_id)
);

-- Create contract templates table
CREATE TABLE contract_evolution_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id INTEGER NOT NULL,
  step_id INTEGER NOT NULL,
  template_name VARCHAR(100) NOT NULL,
  contract_code TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(lesson_id, step_id, template_name)
);

-- Enhance existing lesson_completions table
ALTER TABLE lesson_completions 
ADD COLUMN IF NOT EXISTS evolution_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS final_contract_code TEXT,
ADD COLUMN IF NOT EXISTS generation_triggered BOOLEAN DEFAULT FALSE;

-- Create indexes for performance
CREATE INDEX idx_user_evolution_progress_user_id ON user_evolution_progress(user_id);
CREATE INDEX idx_user_evolution_progress_evolution_stage ON user_evolution_progress(evolution_stage);
CREATE INDEX idx_contract_templates_lesson_step ON contract_evolution_templates(lesson_id, step_id);

COMMIT;
```

### Content Migration

```typescript
// Migration script for existing lesson content
// File: scripts/migrate-lesson-content.ts

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface LegacyLesson {
  // Old lesson structure
}

interface EnhancedLesson {
  // New lesson structure with evolution
}

export async function migrateLessonContent() {
  const lessonFiles = await glob('src/content/lessons/*.json');
  
  for (const file of lessonFiles) {
    const legacy: LegacyLesson = JSON.parse(readFileSync(file, 'utf8'));
    const enhanced: EnhancedLesson = {
      ...legacy,
      // Add default evolution metadata
      evolutionPath: {
        startStage: `lesson_${legacy.id}_start`,
        endStage: `lesson_${legacy.id}_end`,
        majorEvolution: legacy.id > 1 // Lessons 2+ trigger evolution
      },
      steps: legacy.steps.map((step, index) => ({
        ...step,
        // Add default evolution metadata for steps
        difficulty: 'easy',
        estimatedTime: 5
      }))
    };
    
    writeFileSync(file.replace('.json', '-enhanced.json'), JSON.stringify(enhanced, null, 2));
  }
}
```

## Backward Compatibility

### Legacy Support

1. **Existing Lessons**: All existing lesson content continues to work without modification
2. **Optional Fields**: All new fields are optional and have sensible defaults
3. **API Versioning**: New evolution endpoints are additive, existing endpoints unchanged
4. **Graceful Degradation**: Evolution features degrade gracefully if disabled

### Deployment Strategy

1. **Phase 1**: Deploy schema changes with feature flags disabled
2. **Phase 2**: Enable evolution features for new content only
3. **Phase 3**: Gradually migrate existing content with user consent
4. **Phase 4**: Full evolution system activation

This schema provides a robust foundation for the Contract Evolution System while maintaining full backward compatibility with existing MonstersInk! content and functionality.