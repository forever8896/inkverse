# Monster Generation System Guide

> **Complete guide to the Vercel Workflow-powered monster generation pipeline**

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [How It Works](#how-it-works)
4. [Architecture](#architecture)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)
7. [Developer Guide](#developer-guide)

---

## Overview

The **Monster Generation System** creates unique AI-generated creatures for MonstersInk! using a durable, fault-tolerant pipeline powered by **Vercel Workflows**. Each monster generation involves:

1. **Image Generation** - OpenAI DALL-E creates a cute, Spore-like creature (60-90s)
2. **3D Conversion** - fal.ai transforms the 2D image into a 3D GLB model (30-60s)
3. **Storage** - All assets uploaded to S3/MinIO for persistence
4. **NFT Minting** - [Future] Creature minted as NFT on Polkadot

### Key Features

- ✅ **Durable execution** - Survives Vercel function timeouts through event sourcing
- ✅ **Automatic retries** - Smart retry logic for transient failures (rate limits, network issues)
- ✅ **Error classification** - Fatal vs retryable errors with proper user feedback
- ✅ **Real-time status** - Frontend polls for progress updates every 2 seconds
- ✅ **Cost tracking** - OpenAI and fal.ai usage logged to database
- ✅ **S3 integration** - All assets stored durably with presigned URL generation

---

## Quick Start

### For End Users

1. **Navigate to the generator**: Visit `/generate` in your browser
2. **Configure your monster**: Choose attributes (eyes, body type, size, attitude, etc.)
3. **Generate**: Click "Generate Monster" - you'll see a job ID
4. **Wait**: Generation takes ~90-150 seconds total
5. **View**: Your monster appears with 2D image and 3D model (if full generation)

### For Admins (Testing Interface)

```bash
# Start local development server
npm run dev

# Navigate to admin interface
open http://localhost:3004/generate

# Create test monster
curl -X POST http://localhost:3004/api/generate-monster \
  -H "Content-Type: application/json" \
  -d '{
    "eyes": 2,
    "bodyType": "fluffy",
    "size": "medium",
    "attitude": "kawaii",
    "canFly": "wings",
    "specialPower": "star",
    "magicalAura": "sparkly",
    "colorScheme": "rainbow",
    "texture": "fur",
    "habitat": "clouds",
    "stage": "adult",
    "generationType": "full"
  }'
```

---

## How It Works

### The Pipeline (End-to-End)

```
User Request
    ↓
API Route (/api/generate-monster)
    ↓ Creates job + starts workflow
Workflow Engine (Vercel)
    ↓
┌───────────────────────────────────────┐
│ Step 1: Check Storage                │
│ - Verify S3/MinIO accessibility       │
│ - Fail fast if storage is down        │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Step 2: Generate Image (60-90s)       │
│ - Call OpenAI DALL-E (gpt-image-1)    │
│ - Upload PNG to S3                    │
│ - Generate presigned URL              │
│ - Update job: "generating_image"      │
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Step 3: Convert to 3D (30-60s)        │
│ - Download image from S3              │
│ - Call fal.ai image-to-3d             │
│ - Upload GLB model to S3              │
│ - Generate presigned URL              │
│ - Update job: "converting_3d"         │
│ (Skipped for generationType="image_only")
└───────────────────────────────────────┘
    ↓
┌───────────────────────────────────────┐
│ Step 4: Mark Complete                 │
│ - Update job status to "completed"    │
│ - Set progress to 100%                │
│ - Calculate total cost                │
└───────────────────────────────────────┘
    ↓
Final Result
```

### Status Polling

The frontend polls `/api/monster-status/[jobId]` every ~2 seconds:

```typescript
// Frontend polling (every 2s)
const { job, processing } = await fetch(`/api/monster-status/${jobId}`);

if (job.status === 'completed') {
  // Show monster!
  displayMonster(job.imageUrl, job.glbUrl);
} else if (processing) {
  // Still working...
  showProgress(job.progress, job.userMessage);
} else {
  // Check for errors
  if (job.status.includes('failed')) {
    showError(job.errorMessage);
  }
}
```

### Error Handling

The system classifies errors into two categories:

**1. Fatal Errors (No Retry)**
- `openai_invalid_api_key` - API key is wrong
- `openai_content_policy` - Prompt violates content policy
- `openai_insufficient_quota` - Out of credits
- `fal_content_policy` - Image violates safety guidelines

**2. Retryable Errors (Automatic Retry)**
- `openai_rate_limit` - Hit rate limit, retry after 60s
- `openai_network_timeout` - Network issue, retry with backoff
- `s3_upload_error` - S3 upload failed, retry after 30s
- `fal_api_error` - fal.ai temporary issue, retry with backoff

**Error Flow:**
```
Service Error → mapServiceErrorToWorkflowError()
    ↓
    ├─ FatalError → Job marked "failed" → Workflow STOPS
    └─ RetryableError → Job marked "retrying" → Workflow RETRIES
```

---

## Architecture

### Vercel Workflow Directives

The system uses two special directives:

#### `"use workflow"` - Durable Orchestrator

```typescript
"use workflow"

export async function generateMonster(input: GenerateMonsterInput) {
  // Orchestrates steps
  await checkStorage(jobId);
  const imageResult = await generateImage(jobId, prompt, userId);
  const glbResult = await convert3D(jobId, imageResult.imageS3Key, userId);
  const completeResult = await markComplete(...);

  return { jobId, imageUrl, glbUrl, totalCost };
}
```

**Characteristics:**
- Sandboxed environment (no direct DB/API access)
- Survives function timeouts through event sourcing
- Coordinates "use step" functions
- Must be a **named export** (not default)

#### `"use step"` - Individual Tasks

```typescript
"use step"

export async function generateImage(jobId, prompt, userId) {
  const metadata = getStepMetadata(); // { attempt: 1, stepId: '...' }

  // Update job status
  await job.update({ status: 'generating_image' });

  // Call OpenAI
  const result = await openaiService.generateImage(prompt);

  // Handle errors
  if (!result.success) {
    throw mapServiceErrorToWorkflowError(result.errorCode, result.error);
  }

  return { imageS3Key, imageUrl, cost };
}
```

**Characteristics:**
- Can access database and external APIs
- Automatic retry with exponential backoff
- Idempotent (safe to re-run)
- Gets metadata about current attempt

### File Structure

```
src/
├── workflows/
│   ├── generate-monster.ts          # Main workflow ("use workflow")
│   ├── steps/
│   │   ├── check-storage.ts         # Step 1: Pre-flight check
│   │   ├── generate-image.ts        # Step 2: OpenAI image generation
│   │   ├── convert-3d.ts            # Step 3: fal.ai 3D conversion
│   │   └── mark-complete.ts         # Step 4: Finalize job
│   └── utils/
│       ├── error-mapping.ts         # Error classification logic
│       └── logging.ts               # Structured workflow logging
├── app/api/
│   ├── generate-monster/route.ts    # POST - Start generation
│   └── monster-status/[jobId]/route.ts  # GET - Poll status
├── services/
│   ├── production-openai-service.ts # OpenAI API wrapper
│   ├── production-fal-service.ts    # fal.ai API wrapper
│   └── s3-service.ts                # S3/MinIO storage
└── lib/
    ├── generation-job.ts            # Database model
    └── admin-job-helpers.ts         # Shared admin route helpers
```

### Database Schema

```sql
CREATE TABLE monster_generations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES user(id),
  workflow_run_id TEXT,            -- Vercel Workflow run ID

  -- Status tracking
  status TEXT NOT NULL,             -- pending, generating_image, etc.
  progress INTEGER DEFAULT 0,       -- 0-100
  user_message TEXT,                -- Human-readable status
  error_message TEXT,               -- Error details
  retry_count INTEGER DEFAULT 0,    -- Current retry attempt

  -- Assets
  image_s3_key TEXT,                -- S3 key for PNG image
  image_url TEXT,                   -- Presigned URL (expires in 2h)
  glb_s3_key TEXT,                  -- S3 key for GLB model
  glb_url TEXT,                     -- Presigned URL (expires in 2h)

  -- Metadata
  prompt TEXT NOT NULL,             -- Full AI prompt
  style TEXT,                       -- Legacy: cute, fierce, etc.
  stage TEXT,                       -- egg, young, adult
  generation_type TEXT,             -- full, image_only

  -- Cost tracking
  total_cost DECIMAL(10,4),         -- Total USD cost

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

### Cost Tracking

Each generation logs detailed cost data:

```typescript
interface CostTrackingData {
  openaiTextTokens?: number;        // Prompt tokens
  openaiImageTokens?: number;       // Image generation tokens
  openaiTotalTokens?: number;       // Total OpenAI tokens
  falImageGenerationCost?: number;  // fal.ai image cost
  fal3DConversionCost?: number;     // fal.ai 3D cost
  requestSuccessful: boolean;       // Success flag
  errorMessage?: string;            // If failed
  provider: 'openai' | 'fal';       // Service used
  operation: string;                // image_generation, 3d_conversion
}
```

**Typical Costs:**
- OpenAI gpt-image-1 (1024x1024): **$0.04**
- fal.ai image-to-3d: **$0.30**
- **Total per monster**: ~$0.34

---

## API Reference

### POST /api/generate-monster

Creates a new monster generation job.

**Authentication:** Required (Better Auth session) + Admin access

**Request Body:**

```typescript
{
  // Physical Features
  eyes: 1 | 2 | 3 | 8,
  bodyType: 'skeletal' | 'muscular' | 'fluffy' | 'serpentine' | 'rocky',
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive',

  // Personality
  attitude: 'sassy' | 'crypto-degen' | 'rainbow' | 'wise' | 'mischievous' | 'regal' | 'robotic' | 'kawaii',

  // Abilities
  canFly: 'wings' | 'floating' | 'no',
  specialPower: 'fire' | 'ice' | 'lightning' | 'nature' | 'psychic' | 'star' | 'crystal' | 'wind',
  magicalAura: 'sparkly' | 'fiery' | 'cosmic' | 'watery' | 'floral',

  // Appearance
  colorScheme: 'red' | 'blue' | 'green' | 'purple' | 'rainbow' | 'dark' | 'light' | 'metallic',
  texture: 'scales' | 'fur' | 'metal' | 'crystal' | 'plant' | 'ethereal',

  // Environment
  habitat: 'mountains' | 'ocean' | 'forest' | 'space' | 'desert' | 'ruins' | 'city' | 'clouds',

  // Lifecycle
  stage: 'egg' | 'young' | 'adult',

  // Generation options
  generationType?: 'full' | 'image_only'  // Default: 'full'
}
```

**Response:**

```typescript
{
  success: true,
  jobId: "817268bb-22b4-4c31-bab2-039e9a6f0ee4",
  runId: "wrun_01K9F3FB9KXZ77NTBPK15F2GXC"
}
```

**Status Codes:**
- `201` - Job created successfully
- `400` - Validation error
- `401` - Authentication required
- `403` - Admin access required
- `429` - Rate limit exceeded (max active jobs)
- `500` - Internal server error

---

### GET /api/monster-status/[jobId]

Get current status of a generation job.

**Authentication:** Required (must own the job)

**Response:**

```typescript
{
  success: true,
  job: {
    id: "817268bb-22b4-4c31-bab2-039e9a6f0ee4",
    userId: "user_abc123",
    status: "generating_image",         // Current status
    progress: 40,                        // 0-100
    userMessage: "✅ Image generated! Now creating your 3D model...",
    imageUrl: "https://s3.../image.png", // Presigned URL (if ready)
    glbUrl: "https://s3.../model.glb",   // Presigned URL (if ready)
    totalCost: 0.34,                     // USD cost
    createdAt: "2025-01-08T12:00:00Z",
    completedAt: "2025-01-08T12:02:30Z"  // If completed
  },
  processing: true  // Is workflow still running?
}
```

**Job Statuses:**
- `pending` - Waiting to start
- `generating_image` - Calling OpenAI
- `image_generation_retrying` - OpenAI retry in progress
- `image_generation_failed` - OpenAI failed permanently
- `converting_3d` - Calling fal.ai
- `conversion_retrying` - fal.ai retry in progress
- `conversion_failed` - fal.ai failed permanently
- `completed` - Success!
- `failed_permanent` - Unrecoverable error
- `waiting_on_storage` - S3/MinIO not accessible

**Status Codes:**
- `200` - OK
- `400` - Invalid job ID format
- `401` - Authentication required
- `403` - Access denied (not your job)
- `404` - Job not found
- `500` - Internal server error

---

### Admin Routes

#### DELETE /api/admin/jobs/[jobId]

Delete a job and associated S3 files.

**Authentication:** Admin required

**Response:**
```typescript
{
  success: true,
  message: "Job deleted successfully (including image and 3D model)"
}
```

---

#### POST /api/admin/jobs/[jobId]/reset

Reset a stuck job back to pending status.

**Authentication:** Admin required

**Response:**
```typescript
{
  success: true,
  message: "Job reset to pending status. Processing will restart automatically."
}
```

**Note:** Cannot reset already-completed jobs.

---

#### GET /api/admin/jobs/[jobId]

Get detailed job information with workflow observability data.

**Authentication:** Admin required

**Response:**
```typescript
{
  success: true,
  job: { /* job data */ },
  workflow: {
    runId: "wrun_01K9F3FB9KXZ77NTBPK15F2GXC",
    status: "completed",
    steps: [
      { name: "checkStorage", status: "completed", duration: 234 },
      { name: "generateImage", status: "completed", duration: 64120 },
      { name: "convert3D", status: "completed", duration: 42890 },
      { name: "markComplete", status: "completed", duration: 120 }
    ],
    events: [ /* workflow event log */ ]
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Storage unavailable" Error

**Symptom:** Job stuck at `waiting_on_storage`

**Cause:** S3/MinIO service not accessible

**Fix:**
```bash
# Check MinIO is running
lsof -i :9000

# Restart MinIO
minio server ./minio-data --console-address ":9001"

# Verify environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_ENDPOINT_URL
```

---

#### 2. "Rate Limit Exceeded" (429)

**Symptom:** Job fails with `openai_rate_limit`

**Cause:** Too many requests to OpenAI API

**Fix:**
- Wait 60 seconds for rate limit to reset
- Workflow will automatically retry
- Check OpenAI dashboard for rate limit tier

---

#### 3. Workflow Stuck at Same Step

**Symptom:** Progress not advancing, same status for >5 minutes

**Cause:** Workflow may have encountered unexpected error

**Fix (Admin):**
```bash
# Reset the job
curl -X POST http://localhost:3004/api/admin/jobs/[jobId]/reset \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Check workflow logs in Vercel dashboard
# Navigate to: Vercel Project → Functions → Workflow logs
```

---

#### 4. Presigned URLs Expired

**Symptom:** Image/GLB URLs return 403 Forbidden

**Cause:** Presigned URLs expire after 2 hours

**Fix:** The system automatically refreshes URLs when polled if they're >1 hour old. Just reload the page.

---

#### 5. 3D Conversion Fails

**Symptom:** Job fails at `conversion_failed`

**Cause:** fal.ai couldn't process the image

**Possible reasons:**
- Image doesn't have transparent background
- Image too complex for 3D conversion
- fal.ai service issue

**Fix:**
- Try `generationType: "image_only"` to skip 3D conversion
- Regenerate with simpler attributes
- Check fal.ai status page

---

## Developer Guide

### Adding a New Workflow Step

1. **Create step file** in `src/workflows/steps/`:

```typescript
"use step"

import { getStepMetadata } from 'workflow';
import { GenerationJob } from '@/lib/generation-job';

export interface MyStepResult {
  data: string;
  cost: number;
}

export async function myNewStep(
  jobId: string,
  input: string
): Promise<MyStepResult> {
  const metadata = getStepMetadata();

  // Update job status
  const job = await GenerationJob.findById(jobId);
  await job.update({
    status: 'processing_new_step',
    userMessage: '🔧 Doing something cool...'
  });

  // Do work...
  const result = await doWork(input);

  // Handle errors
  if (!result.success) {
    throw new RetryableError('Work failed', { retryAfter: 30000 });
  }

  return { data: result.data, cost: 0.10 };
}
```

2. **Add to workflow** in `src/workflows/generate-monster.ts`:

```typescript
import { myNewStep } from './steps/my-new-step';

export async function generateMonster(input) {
  await checkStorage(jobId);
  const imageResult = await generateImage(...);

  // Add your step
  const newStepResult = await myNewStep(jobId, imageResult.imageS3Key);

  const glbResult = await convert3D(...);
  // ...
}
```

3. **Test locally:**

```bash
# Restart server to rebundle workflows
rm -rf .next && npm run dev

# Create test monster
curl -X POST http://localhost:3004/api/generate-monster \
  -d '{ /* test data */ }'
```

---

### Error Handling Best Practices

1. **Classify errors correctly:**

```typescript
// In error-mapping.ts
ERROR_HANDLERS = {
  'my_service_timeout': {
    retryable: true,              // ✅ Retry
    suggestedRetryDelay: 60,      // Wait 60s
    userMessage: 'Service timeout, retrying...'
  },
  'my_service_bad_input': {
    retryable: false,             // ❌ Fatal
    userMessage: 'Invalid input provided'
  }
}
```

2. **Update job status in steps:**

```typescript
// Before work
await job.update({
  status: 'processing',
  userMessage: '⏳ Starting work...'
});

// On error
if (error instanceof FatalError) {
  await job.update({
    status: 'failed_permanent',
    errorMessage: error.message
  });
}
```

3. **Use structured logging:**

```typescript
const logger = new WorkflowLogger({ jobId, stepName, attempt });

logger.info('Starting work', { inputSize: input.length });
logger.success('Work completed', { outputSize: output.length });
logger.error('Work failed', error, { context: '...' });
```

---

### Testing Workflows Locally

```bash
# 1. Start MinIO
minio server ./minio-data --console-address ":9001"

# 2. Start dev server
npm run dev

# 3. Create bucket
aws --endpoint-url http://localhost:9000 \
  s3 mb s3://monsters-ink-dev

# 4. Test generation
curl -X POST http://localhost:3004/api/generate-monster \
  -H "Content-Type: application/json" \
  -d @test-monster.json

# 5. Monitor logs
# Watch terminal for workflow step execution
# Check MinIO UI: http://localhost:9001
```

---

### Deploying to Production

1. **Set environment variables** in Vercel:

```bash
OPENAI_API_KEY=sk-...
FAL_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_ENDPOINT_URL=https://s3.amazonaws.com
S3_BUCKET=monsters-ink-production
POSTGRES_URL=postgresql://...
```

2. **Deploy:**

```bash
vercel --prod
```

3. **Monitor workflow execution:**
- Vercel Dashboard → Functions → Workflow runs
- Check execution times and error rates
- Set up alerts for failed workflows

---

## Performance Optimization

### Current Timings

- **Storage check**: ~200ms
- **Image generation**: 60-90 seconds (OpenAI)
- **3D conversion**: 30-60 seconds (fal.ai)
- **S3 uploads**: ~500ms each
- **Total**: ~90-150 seconds for full generation

### Optimization Strategies

1. **Parallel execution** (future):
```typescript
// Generate variations in parallel
const [variant1, variant2] = await Promise.all([
  generateImage(prompt1),
  generateImage(prompt2)
]);
```

2. **Caching** (future):
```typescript
// Cache common creature combinations
const cacheKey = hash({ eyes, bodyType, size, ... });
const cached = await redis.get(cacheKey);
if (cached) return cached;
```

3. **Conditional 3D conversion:**
```typescript
// Skip 3D for preview mode
if (generationType === 'image_only') {
  // Only generate image
}
```

---

## Security Considerations

### API Key Protection

- Never expose API keys in client-side code
- All AI generation happens server-side
- Prompt generation server-side prevents prompt injection

### Rate Limiting

- Max 2 active jobs per user
- Prevents resource exhaustion
- Database constraint enforces uniqueness

### Content Moderation

- All prompts pass through OpenAI's moderation API
- Content policy violations result in `openai_content_policy` error
- No manual review required

### S3 Security

- Presigned URLs expire after 2 hours
- Automatic refresh on status polling
- Private bucket with signed requests only

---

## Monitoring & Observability

### Key Metrics to Track

1. **Success Rate**: `completed / (completed + failed)`
2. **Average Duration**: Time from create to complete
3. **Error Distribution**: Which errors are most common?
4. **Cost per Generation**: Track API costs
5. **Retry Rate**: How often do workflows retry?

### Logging Strategy

**Workflow Steps:** Structured JSON logs
```json
{
  "level": "info",
  "jobId": "817268bb...",
  "stepName": "generateImage",
  "attempt": 1,
  "message": "Image generated successfully",
  "metadata": { "s3Key": "monsters/...", "cost": 0.04 }
}
```

**API Routes:** Minimal logging (avoid flooding)
```typescript
console.log(`[API] Creating monster generation job - userId: ${userId}`);
```

---

## Future Enhancements

### Planned Features

- [ ] **NFT Minting** - Mint monsters as NFTs on Polkadot
- [ ] **Creature Evolution** - Progressive contract building system
- [ ] **Batch Generation** - Generate multiple variants at once
- [ ] **Advanced Caching** - Redis cache for common combinations
- [ ] **Webhook Notifications** - Notify users when complete
- [ ] **Custom Training** - Fine-tune models on user preferences

### Experimental Ideas

- [ ] **Real-time 3D Preview** - Stream 3D conversion progress
- [ ] **Collaborative Creatures** - Merge traits from multiple users
- [ ] **Creature Battles** - Generate battle animations
- [ ] **Voice Synthesis** - Give creatures unique voices

---

## Support & Contributing

### Getting Help

- **Bug Reports**: [GitHub Issues](https://github.com/your-repo/issues)
- **Feature Requests**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Documentation**: [Claude Code Docs](https://docs.claude.com/en/docs/claude-code)

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-step`
3. Make your changes
4. Test thoroughly with local workflow execution
5. Submit a pull request

**Code Style:**
- Follow existing patterns in `src/workflows/`
- Add comprehensive error handling
- Include TypeScript types
- Write structured logs with WorkflowLogger

---

## Appendix

### Glossary

- **Workflow** - Durable task orchestrator that survives timeouts
- **Step** - Individual task within a workflow (retryable, idempotent)
- **Event Sourcing** - Technique for persisting workflow progress as events
- **Presigned URL** - Temporary URL for accessing S3 objects
- **Fatal Error** - Error that stops workflow (no retry)
- **Retryable Error** - Error that triggers automatic retry
- **Generation Job** - Database record tracking monster creation progress

### Related Documentation

- [Vercel Workflows Documentation](https://vercel.com/docs/workflow)
- [OpenAI Image Generation API](https://platform.openai.com/docs/guides/images)
- [fal.ai Image-to-3D](https://fal.ai/models/image-to-3d)
- [AWS S3 SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/)
- [MinIO Documentation](https://min.io/docs/)

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Maintainer:** MonstersInk! Team
