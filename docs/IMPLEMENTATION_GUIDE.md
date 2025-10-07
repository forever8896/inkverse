# Contract Evolution Implementation Guide

## Overview

This guide provides detailed technical implementation steps for integrating the Contract Evolution System into the MonstersInk! platform. It covers schema updates, content creation workflows, and integration patterns.

## Implementation Phases

### Phase 1: Schema and Type System Updates

#### 1.1 Enhanced Lesson Types

Update `/src/lib/lesson-types.ts`:

```typescript
// Enhanced validation rules for contract evolution
export interface ValidationRule {
  type: 'includes' | 'excludes' | 'regex' | 'custom' | 'contract_builds' | 'test_passes';
  patterns: string[];
  message?: string;
  severity?: 'error' | 'warning' | 'info';
}

// Contract evolution metadata
export interface ContractEvolution {
  stage: string;                    // "egg", "creature", "monster", "communicator", "intelligent", "social"
  newFeatures: string[];           // Features being added in this step
  visualAssets?: string[];         // Associated visual evolution assets
  contractBase?: string;           // Starting contract code (builds on previous lesson)
  complexity: 'foundation' | 'feature' | 'evolution' | 'mastery';
  evolutionTrigger?: {
    type: 'completion' | 'validation' | 'authentication';
    generateArt?: boolean;         // Whether to trigger AI art generation
    artPrompts?: string[];         // AI generation prompts for this stage
  };
}

// Enhanced lesson step with contract evolution support
export interface LessonStep {
  id: number;
  title: string;
  content: string;
  code?: string;
  expectedCode?: string;
  hint?: string;
  validation?: ValidationRule[];
  image?: string;
  requiresAuth?: boolean;
  
  // Contract evolution fields
  contractEvolution?: ContractEvolution;
  buildsOnStep?: number;           // References previous step's contract
  triggersGeneration?: boolean;    // Whether completing this step triggers AI generation
  
  // Learning progression
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  estimatedTime?: number;          // Minutes to complete
  prerequisites?: string[];        // Required concepts or previous steps
}

// Enhanced lesson with evolution tracking
export interface Lesson {
  id: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  objectives: string[];
  steps: LessonStep[];
  completed: boolean;
  locked: boolean;
  
  // Evolution metadata
  evolutionPath?: {
    startStage: string;            // What creature stage this lesson starts with
    endStage: string;              // What creature stage this lesson ends with
    majorEvolution: boolean;       // Whether this lesson triggers major visual change
  };
  
  // Dependencies
  requiresCompletion?: number[];   // Lesson IDs that must be completed first
  contractContinuity?: {
    inheritsFrom?: number;         // Lesson ID this builds on
    provides?: string[];           // Contract features this lesson provides
  };
}
```

#### 1.2 Contract Evolution Service

Create `/src/lib/contract-evolution.ts`:

```typescript
import { LessonStep, ContractEvolution } from './lesson-types';

export interface EvolutionState {
  currentStage: string;
  completedSteps: number[];
  contractCode: string;
  visualAssets: string[];
  lastEvolution: Date;
}

export class ContractEvolutionService {
  /**
   * Get the base contract code for a lesson step
   * Builds on previous steps if specified
   */
  static async getBaseContract(
    step: LessonStep, 
    previousSteps: LessonStep[]
  ): Promise<string> {
    if (!step.buildsOnStep) {
      return step.code || '';
    }

    const baseStep = previousSteps.find(s => s.id === step.buildsOnStep);
    if (!baseStep) {
      throw new Error(`Base step ${step.buildsOnStep} not found`);
    }

    return baseStep.expectedCode || baseStep.code || '';
  }

  /**
   * Validate contract evolution continuity
   * Ensures new code builds on previous correctly
   */
  static validateEvolution(
    currentCode: string,
    evolution: ContractEvolution,
    previousCode?: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required new features
    evolution.newFeatures.forEach(feature => {
      if (!currentCode.includes(feature)) {
        errors.push(`Missing required feature: ${feature}`);
      }
    });

    // If building on previous code, ensure backward compatibility
    if (previousCode) {
      const previousStructs = this.extractStructs(previousCode);
      const currentStructs = this.extractStructs(currentCode);
      
      // Ensure previous struct fields are maintained
      previousStructs.forEach(prevStruct => {
        const currentStruct = currentStructs.find(s => s.name === prevStruct.name);
        if (!currentStruct) {
          errors.push(`Missing struct: ${prevStruct.name}`);
          return;
        }
        
        prevStruct.fields.forEach(field => {
          if (!currentStruct.fields.includes(field)) {
            errors.push(`Missing field in ${prevStruct.name}: ${field}`);
          }
        });
      });
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Extract struct information from contract code
   * For backward compatibility validation
   */
  private static extractStructs(code: string): Array<{name: string, fields: string[]}> {
    const structs: Array<{name: string, fields: string[]}> = [];
    const structRegex = /struct\s+(\w+)\s*\{([^}]+)\}/g;
    
    let match;
    while ((match = structRegex.exec(code)) !== null) {
      const name = match[1];
      const fieldsText = match[2];
      const fields = fieldsText
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0)
        .map(f => f.split(':')[0].trim());
      
      structs.push({ name, fields });
    }
    
    return structs;
  }

  /**
   * Determine if step completion should trigger AI generation
   */
  static shouldTriggerGeneration(step: LessonStep, evolution: EvolutionState): boolean {
    if (!step.triggersGeneration) return false;
    
    // Check if this is a major evolution milestone
    const evolutionTriggers = ['creature', 'monster', 'communicator', 'intelligent', 'social'];
    return evolutionTriggers.includes(step.contractEvolution?.stage || '');
  }

  /**
   * Get AI generation prompts for evolution stage
   */
  static getGenerationPrompts(step: LessonStep): string[] {
    const defaultPrompts = {
      creature: ['A simple digital creature awakening from an egg'],
      monster: ['A magnificent monster with {type} elemental powers'],
      communicator: ['A monster with glowing communication abilities'],
      intelligent: ['An intelligent monster with neural patterns'],
      social: ['A social monster with companion creatures']
    };

    const stage = step.contractEvolution?.stage;
    if (!stage) return [];

    return step.contractEvolution?.evolutionTrigger?.artPrompts || 
           defaultPrompts[stage as keyof typeof defaultPrompts] || 
           [];
  }
}
```

### Phase 2: Lesson Content Migration

#### 2.1 Enhanced Lesson 2 Implementation

Create `/src/content/lessons/2-enhanced.json`:

```json
{
  "id": 2,
  "title": "The Creature Emerges",
  "description": "Transform your simple creature into a magnificent monster with identity, powers, and intelligence. Master advanced ink! patterns while watching your creation evolve.",
  "difficulty": "Beginner",
  "duration": "45 min",
  "objectives": [
    "Transform creature to monster with identity and type",
    "Implement event-driven architecture",
    "Master error handling with Result patterns",
    "Create comprehensive unit tests",
    "Understand payable message patterns"
  ],
  "evolutionPath": {
    "startStage": "creature",
    "endStage": "monster",
    "majorEvolution": true
  },
  "contractContinuity": {
    "inheritsFrom": 1,
    "provides": ["MonsterType", "Events", "ErrorHandling", "PayableMessages", "UnitTests"]
  },
  "steps": [
    {
      "id": 1,
      "title": "🏷️ Give Your Creature a Name",
      "image": "/creatures/creature_naming.png",
      "content": "Every great monster needs a name and identity! Let's transform your simple creature into a named monster with personality.",
      "code": "// Starting from your Lesson 1 creature...",
      "contractEvolution": {
        "stage": "creature",
        "newFeatures": ["name: String", "monster_type: MonsterType"],
        "complexity": "feature"
      },
      "buildsOnStep": 6,
      "difficulty": "easy",
      "estimatedTime": 5
    }
    // ... additional steps following the pattern
  ],
  "completed": false,
  "locked": true
}
```

#### 2.2 Contract Template System

Create `/src/lib/contract-templates.ts`:

```typescript
export const ContractTemplates = {
  lesson1Base: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod creature {
    #[ink(storage)]
    pub struct Creature {
        is_conscious: bool,
    }

    impl Creature {
        #[ink(constructor)]
        pub fn new() -> Self {
            Self { is_conscious: false }
        }

        #[ink(message)]
        pub fn is_awake(&self) -> bool {
            self.is_conscious
        }

        #[ink(message)]
        pub fn wake_up(&mut self) {
            self.is_conscious = !self.is_conscious;
        }
    }
}`,

  lesson2Base: `#![cfg_attr(not(feature = "std"), no_std, no_main)]

#[ink::contract]
mod monster {
    use ink::prelude::string::String;

    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum MonsterType {
        Fire,
        Water,
        Earth,
        Air,
    }

    #[ink(storage)]
    pub struct Monster {
        // Inherited from creature
        is_conscious: bool,
        
        // New monster features
        name: String,
        monster_type: MonsterType,
        owner: AccountId,
        created_at: u64,
        is_sleeping: bool,
        energy_level: u32,
    }
    
    // Implementation continues...
}`,

  // Additional templates for lessons 3-5...
};

export function getTemplateForLesson(lessonId: number, stepId?: number): string {
  const key = stepId 
    ? `lesson${lessonId}Step${stepId}` 
    : `lesson${lessonId}Base`;
    
  return ContractTemplates[key as keyof typeof ContractTemplates] || '';
}
```

### Phase 3: Integration with Existing Systems

#### 3.1 Lesson Loading Service Updates

Update `/src/lib/lessons-server.ts`:

```typescript
import { ContractEvolutionService } from './contract-evolution';

export async function getLessonWithEvolution(id: number): Promise<Lesson> {
  const lesson = await getLesson(id);
  
  // Process contract evolution for each step
  const processedSteps = await Promise.all(
    lesson.steps.map(async (step, index) => {
      if (step.buildsOnStep) {
        const previousSteps = lesson.steps.slice(0, index);
        const baseContract = await ContractEvolutionService.getBaseContract(step, previousSteps);
        
        return {
          ...step,
          code: step.code || baseContract
        };
      }
      return step;
    })
  );

  return {
    ...lesson,
    steps: processedSteps
  };
}
```

#### 3.2 Validation System Updates

Update `/src/lib/validation.ts`:

```typescript
import { ContractEvolutionService } from './contract-evolution';

export function validateCode(
  code: string, 
  rules: ValidationRule[], 
  step?: LessonStep,
  previousCode?: string
): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Existing validation logic...

  // Contract evolution validation
  if (step?.contractEvolution && previousCode) {
    const evolutionResult = ContractEvolutionService.validateEvolution(
      code, 
      step.contractEvolution, 
      previousCode
    );
    
    if (!evolutionResult.valid) {
      result.isValid = false;
      result.errors.push(...evolutionResult.errors);
    }
  }

  return result;
}
```

### Phase 4: AI Generation Integration

#### 4.1 Evolution-Triggered Generation

Update AI generation service to handle evolution triggers:

```typescript
// In your AI generation service
export async function handleEvolutionGeneration(
  step: LessonStep,
  userSession: Session,
  contractCode: string
): Promise<GenerationResult> {
  if (!ContractEvolutionService.shouldTriggerGeneration(step, currentEvolution)) {
    return { triggered: false };
  }

  const prompts = ContractEvolutionService.getGenerationPrompts(step);
  const monsterType = extractMonsterType(contractCode);
  
  // Customize prompts based on contract state
  const customizedPrompts = prompts.map(prompt => 
    prompt.replace('{type}', monsterType || 'mysterious')
  );

  return await generateMonsterArt(customizedPrompts, userSession);
}

function extractMonsterType(contractCode: string): string | null {
  const typeMatch = contractCode.match(/MonsterType::(\w+)/);
  return typeMatch ? typeMatch[1].toLowerCase() : null;
}
```

### Phase 5: Testing and Quality Assurance

#### 5.1 Contract Evolution Tests

Create `/src/lib/__tests__/contract-evolution.test.ts`:

```typescript
import { ContractEvolutionService } from '../contract-evolution';
import { ContractTemplates } from '../contract-templates';

describe('ContractEvolutionService', () => {
  describe('validateEvolution', () => {
    it('should validate backward compatibility', () => {
      const previousCode = ContractTemplates.lesson1Base;
      const currentCode = ContractTemplates.lesson2Base;
      
      const result = ContractEvolutionService.validateEvolution(
        currentCode,
        {
          stage: 'monster',
          newFeatures: ['MonsterType', 'name'],
          complexity: 'evolution'
        },
        previousCode
      );

      expect(result.valid).toBe(true);
    });

    it('should detect missing required features', () => {
      const incompleteCode = `#[ink::contract] mod test {}`;
      
      const result = ContractEvolutionService.validateEvolution(
        incompleteCode,
        {
          stage: 'monster',
          newFeatures: ['MonsterType'],
          complexity: 'evolution'
        }
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required feature: MonsterType');
    });
  });
});
```

#### 5.2 Integration Tests

Create comprehensive tests for the lesson evolution system:

```typescript
// Integration test for complete lesson evolution
describe('Lesson Evolution Integration', () => {
  it('should complete full evolution from egg to social monster', async () => {
    // Test complete journey through all lessons
    const lessons = [1, 2, 3, 4, 5];
    let currentCode = '';
    
    for (const lessonId of lessons) {
      const lesson = await getLessonWithEvolution(lessonId);
      
      for (const step of lesson.steps) {
        if (step.buildsOnStep) {
          const baseCode = await ContractEvolutionService.getBaseContract(
            step, 
            lesson.steps.slice(0, step.id - 1)
          );
          expect(baseCode).toBeTruthy();
        }
        
        currentCode = step.expectedCode || currentCode;
      }
    }
    
    // Verify final contract has all evolution features
    expect(currentCode).toContain('MonsterType');
    expect(currentCode).toContain('events');
    expect(currentCode).toContain('cross_contract_call');
  });
});
```

## Deployment Considerations

### Vercel Serverless Compatibility

- **Cold Start Optimization**: Contract templates cached in memory
- **Asset Delivery**: CDN integration for evolution images
- **Database Efficiency**: Optimized queries for evolution state tracking

### Performance Monitoring

- **Evolution Completion Rates**: Track lesson completion metrics
- **AI Generation Costs**: Monitor and optimize generation triggers
- **User Engagement**: Measure time spent in evolved contract lessons

## Migration Strategy

### Phase 1: Schema Migration (Week 1)
1. Deploy enhanced type definitions
2. Update database schema for evolution tracking
3. Migrate existing lesson data

### Phase 2: Content Migration (Week 2-3)
1. Implement enhanced Lesson 2 with evolution
2. Create contract templates and validation
3. Update lesson loading systems

### Phase 3: AI Integration (Week 4)
1. Integrate evolution-triggered generation
2. Update visual asset pipeline
3. Comprehensive testing

### Phase 4: Production Deployment (Week 5)
1. Gradual rollout to users
2. Performance monitoring
3. User feedback collection and iteration

This implementation guide provides the technical foundation for building the Contract Evolution System while maintaining production quality standards and ensuring seamless integration with the existing MonstersInk! platform.