/**
 * POST /api/generate-monster
 * Creates a new monster generation job and returns job ID
 * Does NOT perform actual AI generation - that happens in background worker
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { auth } from '@/lib/auth';
import { RATE_LIMITS } from '@/config/constants';

// Server-side AI prompt generation from structured data
// This generates the FULL prompt that gets sent to OpenAI, including all wrapper instructions
function generatePromptFromStructuredData(
  data: GenerateMonsterRequest
): string {
  const eyeText =
    data.eyes === 1
      ? 'one eye'
      : data.eyes === 2
        ? 'two eyes'
        : data.eyes === 3
          ? 'three eyes'
          : 'many eyes';
  const flyText =
    data.canFly === 'wings'
      ? 'with wings for flying'
      : data.canFly === 'floating'
        ? 'that floats magically'
        : 'that is grounded';

  // Core creature description - include stage for proper lifecycle representation
  const stageDescription = data.stage === 'egg'
    ? 'in egg form, unhatched with visible shell'
    : data.stage === 'young'
      ? 'in juvenile/baby form, small and youthful'
      : 'in fully grown adult form, mature and majestic';

  const creatureDescription = `A cute, friendly Spore-like ${data.size} ${data.attitude} ${data.stage} digital creature ${stageDescription} with ${eyeText}, ${data.bodyType} body type, ${data.texture} texture, ${data.colorScheme} colors, ${data.specialPower} powers, ${data.magicalAura} magical aura, ${flyText}, living in ${data.habitat}. Adorable, colorful, cartoon-like illustration suitable for educational content. The creature should look approachable and non-threatening, perfect for teaching programming concepts. High quality, detailed, vibrant colors.`;

  // Wrap with production instructions (matches production-openai-service.ts wrapper)
  return `Generate a cute, lovable, friendly Spore-like digital creature for a learning game.

Creature description: ${creatureDescription}

CRITICAL REQUIREMENTS:
- Style: adorable, colorful, cartoon-like 3D character based on "Spore" game
- THREE-DIMENSIONAL FORM with rounded, volumetric shapes that show depth and dimension
- Use soft shading, highlights, and shadows to emphasize the creature's 3D form and curved surfaces
- The creature should have clear dimensional depth - front/back, top/bottom distinctions visible
- Approachable and non-threatening, perfect for teaching programming concepts
- High quality, detailed, vibrant colors with gradients that enhance 3D appearance
- TRANSPARENT BACKGROUND - absolutely clear/transparent, no colors, no gradient, pure transparency
- Isolated subject suspended in void with no environment whatsoever
- The creature is NOT standing, sitting, or resting on anything
- NO floor, ground, platform, surface, grass, rocks, or terrain of any kind
- NO separate environmental elements floating in space (stars, sparkles, fairy dust, halos, auras, glowing orbs)
- Magical effects should be integrated INTO the creature's body as physical features (like glowing spots ON skin, crystalline horns, energy patterns IN fur)
- NO detached ambient effects or floating decorative elements surrounding the creature
- Avoid overly flat or symmetrical compositions - show the creature at a slight angle to reveal dimensionality

The creature itself should be fully three-dimensional and volumetric, like a 3D game character model, rendered with clear depth cues and shading. All magical/decorative elements must be part of the creature's anatomy, not floating around it. Pure transparent background with absolutely nothing except the creature itself.`;
}

export interface GenerateMonsterRequest {
  // Physical Features
  eyes: number;
  bodyType: 'skeletal' | 'muscular' | 'fluffy' | 'serpentine' | 'rocky';
  size: 'tiny' | 'small' | 'medium' | 'large' | 'massive';

  // Personality & Style
  attitude:
    | 'sassy'
    | 'crypto-degen'
    | 'rainbow'
    | 'wise'
    | 'mischievous'
    | 'regal'
    | 'robotic'
    | 'kawaii';

  // Magical Abilities
  canFly: 'wings' | 'floating' | 'no';
  specialPower:
    | 'fire'
    | 'ice'
    | 'lightning'
    | 'nature'
    | 'psychic'
    | 'star'
    | 'crystal'
    | 'wind';
  magicalAura: 'sparkly' | 'fiery' | 'cosmic' | 'watery' | 'floral';

  // Appearance
  colorScheme:
    | 'red'
    | 'blue'
    | 'green'
    | 'purple'
    | 'rainbow'
    | 'dark'
    | 'light'
    | 'metallic';
  texture: 'scales' | 'fur' | 'metal' | 'crystal' | 'plant' | 'ethereal';

  // Environment
  habitat:
    | 'mountains'
    | 'ocean'
    | 'forest'
    | 'space'
    | 'desert'
    | 'ruins'
    | 'city'
    | 'clouds';

  // Keep existing for backward compatibility
  style?: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic'; // Legacy - defaults to 'cute'
  stage: 'egg' | 'young' | 'adult';
  generationType?: 'full' | 'image_only';
}

export interface GenerateMonsterResponse {
  success: boolean;
  jobId?: string;
  runId?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Require admin access - this is a testing interface
    // In production, monster generation happens through the lesson flow
    const { isUserAdmin } = await import('@/lib/admin-auth');
    const isAdmin = await isUserAdmin(session.user.id);

    if (!isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin access required. This is a testing interface.',
        },
        { status: 403 }
      );
    }

    // Parse request body
    let body: GenerateMonsterRequest;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate structured monster data
    const validationErrors: string[] = [];

    // Physical Features
    if (typeof body.eyes !== 'number' || ![1, 2, 3, 8].includes(body.eyes)) {
      validationErrors.push('eyes must be 1, 2, 3, or 8');
    }

    if (
      !body.bodyType ||
      !['skeletal', 'muscular', 'fluffy', 'serpentine', 'rocky'].includes(
        body.bodyType
      )
    ) {
      validationErrors.push(
        'bodyType must be one of: skeletal, muscular, fluffy, serpentine, rocky'
      );
    }

    if (
      !body.size ||
      !['tiny', 'small', 'medium', 'large', 'massive'].includes(body.size)
    ) {
      validationErrors.push(
        'size must be one of: tiny, small, medium, large, massive'
      );
    }

    // Personality & Style
    if (
      !body.attitude ||
      ![
        'sassy',
        'crypto-degen',
        'rainbow',
        'wise',
        'mischievous',
        'regal',
        'robotic',
        'kawaii',
      ].includes(body.attitude)
    ) {
      validationErrors.push(
        'attitude must be one of: sassy, crypto-degen, rainbow, wise, mischievous, regal, robotic, kawaii'
      );
    }

    // Magical Abilities
    if (!body.canFly || !['wings', 'floating', 'no'].includes(body.canFly)) {
      validationErrors.push('canFly must be one of: wings, floating, no');
    }

    if (
      !body.specialPower ||
      ![
        'fire',
        'ice',
        'lightning',
        'nature',
        'psychic',
        'star',
        'crystal',
        'wind',
      ].includes(body.specialPower)
    ) {
      validationErrors.push(
        'specialPower must be one of: fire, ice, lightning, nature, psychic, star, crystal, wind'
      );
    }

    if (
      !body.magicalAura ||
      !['sparkly', 'fiery', 'cosmic', 'watery', 'floral'].includes(
        body.magicalAura
      )
    ) {
      validationErrors.push(
        'magicalAura must be one of: sparkly, fiery, cosmic, watery, floral'
      );
    }

    // Appearance
    if (
      !body.colorScheme ||
      ![
        'red',
        'blue',
        'green',
        'purple',
        'rainbow',
        'dark',
        'light',
        'metallic',
      ].includes(body.colorScheme)
    ) {
      validationErrors.push(
        'colorScheme must be one of: red, blue, green, purple, rainbow, dark, light, metallic'
      );
    }

    if (
      !body.texture ||
      !['scales', 'fur', 'metal', 'crystal', 'plant', 'ethereal'].includes(
        body.texture
      )
    ) {
      validationErrors.push(
        'texture must be one of: scales, fur, metal, crystal, plant, ethereal'
      );
    }

    // Environment
    if (
      !body.habitat ||
      ![
        'mountains',
        'ocean',
        'forest',
        'space',
        'desert',
        'ruins',
        'city',
        'clouds',
      ].includes(body.habitat)
    ) {
      validationErrors.push(
        'habitat must be one of: mountains, ocean, forest, space, desert, ruins, city, clouds'
      );
    }

    // Legacy fields - style is optional for backward compatibility
    if (
      body.style &&
      !['cute', 'fierce', 'mysterious', 'playful', 'cosmic'].includes(
        body.style
      )
    ) {
      validationErrors.push(
        'style must be one of: cute, fierce, mysterious, playful, cosmic'
      );
    }

    // Default to 'cute' if not provided (legacy support)
    body.style = body.style || 'cute';

    if (!body.stage || !['egg', 'young', 'adult'].includes(body.stage)) {
      validationErrors.push('stage must be one of: egg, young, adult');
    }

    const generationType = body.generationType ?? 'full';
    if (!['full', 'image_only'].includes(generationType)) {
      validationErrors.push('generationType must be one of: full, image_only');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation errors: ${validationErrors.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Check if user has reached generation limit
    const recentJobs = await GenerationJob.findByUserId(
      session.user.id,
      RATE_LIMITS.DEFAULT_JOB_FETCH_LIMIT,
      0
    );
    const activeJobs = recentJobs.filter(
      (job) =>
        job.status === 'pending' ||
        job.status === 'generating_image' ||
        job.status === 'converting_3d'
    );

    if (activeJobs.length >= RATE_LIMITS.MAX_ACTIVE_JOBS_PER_USER) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum of ${RATE_LIMITS.MAX_ACTIVE_JOBS_PER_USER} active jobs allowed per user`,
        },
        { status: 429 }
      );
    }

    // Check for existing active job (duplicate prevention)
    const existingJob = await GenerationJob.findActive({
      userId: session.user.id
    });

    if (existingJob && existingJob.workflowRunId) {
      // Verify workflow run actually exists before resuming
      try {
        const { getRun } = await import('workflow/api');
        const run = await getRun(existingJob.workflowRunId);
        const status = await run.status;

        if (status === 'running') {
          console.log(`♻️  [API] Resuming existing job ${existingJob.id} with run ${existingJob.workflowRunId}`);
          return NextResponse.json({
            success: true,
            jobId: existingJob.id,
            runId: existingJob.workflowRunId,
            resumed: true
          }, { status: 200 });
        } else {
          console.log(`⚠️  [API] Existing job ${existingJob.id} workflow is ${status}, marking as failed`);
          await existingJob.update({ status: 'failed', errorMessage: 'Workflow no longer running' });
        }
      } catch (error) {
        console.log(`❌ [API] Workflow run ${existingJob.workflowRunId} not found, marking job as failed`);
        await existingJob.update({ status: 'failed', errorMessage: 'Workflow run not found' });
      }
    }

    // Generate AI prompt server-side from structured data
    const aiPrompt = generatePromptFromStructuredData(body);
    console.log(`[API] Creating monster generation job - userId: ${session.user.id}, stage: ${body.stage}, style: ${body.style}`);

    // Create the generation job
    const job = await GenerationJob.create({
      userId: session.user.id,
      prompt: aiPrompt,
      style: body.style,
      stage: body.stage,
      generationType,
    });

    console.log(
      `✅ [API] Created generation job ${job.id} for user ${session.user.id}`
    );

    // Start Workflow
    const { start } = await import('workflow/api');
    const { generateMonster } = await import('@/workflows/generate-monster');

    const run = await start(generateMonster, [{
      jobId: job.id,
      userId: session.user.id,
      prompt: aiPrompt,
      generationType
    }]);

    console.log(`✅ [API] Workflow started: ${run.runId}`);

    // Store runId for status tracking
    await job.update({ workflowRunId: run.runId });

    // Return job ID and run ID for tracking
    const response: GenerateMonsterResponse = {
      success: true,
      jobId: job.id,
      runId: run.runId,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('[API] Generate monster error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For development - show API info on GET
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/generate-monster',
    description: 'Create a new monster generation job with structured data',
    parameters: {
      // Physical Features
      eyes: 'number (1, 2, 3, or 8)',
      bodyType: 'skeletal | muscular | fluffy | serpentine | rocky',
      size: 'tiny | small | medium | large | massive',
      // Personality & Style
      attitude:
        'sassy | crypto-degen | rainbow | wise | mischievous | regal | robotic | kawaii',
      // Magical Abilities
      canFly: 'wings | floating | no',
      specialPower:
        'fire | ice | lightning | nature | psychic | star | crystal | wind',
      magicalAura: 'sparkly | fiery | cosmic | watery | floral',
      // Appearance
      colorScheme:
        'red | blue | green | purple | rainbow | dark | light | metallic',
      texture: 'scales | fur | metal | crystal | plant | ethereal',
      // Environment
      habitat:
        'mountains | ocean | forest | space | desert | ruins | city | clouds',
      // Legacy fields
      style: '(optional) cute | fierce | mysterious | playful | cosmic - defaults to cute',
      stage: 'egg | young | adult',
    },
    note: 'AI prompt is generated server-side from structured data for security',
    authentication: 'Required (Better Auth session)',
    rateLimit: `Maximum ${RATE_LIMITS.MAX_ACTIVE_JOBS_PER_USER} active jobs per user`,
  });
}
