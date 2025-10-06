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

  // Core creature description
  const creatureDescription = `A cute, friendly Spore-like ${data.size} ${data.attitude} digital creature with ${eyeText}, ${data.bodyType} body type, ${data.texture} texture, ${data.colorScheme} colors, ${data.specialPower} powers, ${data.magicalAura} magical aura, ${flyText}, living in ${data.habitat}. Adorable, colorful, cartoon-like illustration suitable for educational content. The creature should look approachable and non-threatening, perfect for teaching programming concepts. High quality, detailed, vibrant colors.`;

  // Wrap with production instructions (matches production-openai-service.ts wrapper)
  return `ISOLATED SUBJECT on COMPLETELY TRANSPARENT BACKGROUND. Product photography style - single creature floating in void with no environment.

Generate a cute, lovable, friendly Spore-like digital creature for a learning game.

Creature description: ${creatureDescription}

CRITICAL REQUIREMENTS:
- Style: adorable, colorful, cartoon-like illustration based on "Spore" game
- The creature should look approachable and non-threatening, perfect for teaching programming
- High quality, detailed, vibrant colors
- TRANSPARENT BACKGROUND - absolutely clear/transparent, no colors, no gradient, pure transparency
- Isolated subject floating in void - like a product photo or game sprite
- The creature is NOT standing, sitting, or resting on anything
- NO floor, ground, platform, surface, grass, rocks, or terrain of any kind beneath the creature
- NO environmental elements (stars, sparkles, fairy dust, halos, auras, glows) floating AROUND the creature
- Any decorative elements (sparkles, stars, magical effects) must be physically ATTACHED TO or PART OF the creature's body itself
- No background decorations, no surrounding effects, no ambient elements
- Simple, clean silhouette suitable for 3D modeling - avoid overly complex shapes

The creature itself can be as decorative and sparkly as needed, but it must be an isolated subject on transparent background with nothing around it or under it.`;
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
  style: 'cute' | 'fierce' | 'mysterious' | 'playful' | 'cosmic';
  stage: 'egg' | 'young' | 'adult';
  generationType?: 'full' | 'image_only';
}

export interface GenerateMonsterResponse {
  success: boolean;
  jobId?: string;
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

    // Legacy fields
    if (
      !body.style ||
      !['cute', 'fierce', 'mysterious', 'playful', 'cosmic'].includes(
        body.style
      )
    ) {
      validationErrors.push(
        'style must be one of: cute, fierce, mysterious, playful, cosmic'
      );
    }

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

    // Generate AI prompt server-side from structured data
    const aiPrompt = generatePromptFromStructuredData(body);
    console.log(`🧪 [API] ========================================`);
    console.log(`🧪 [API] CREATING NEW MONSTER GENERATION JOB`);
    console.log(`🧪 [API] User ID: ${session.user.id}`);
    console.log(`🧪 [API] Generated AI Prompt: "${aiPrompt}"`);
    console.log(`🧪 [API] Style: ${body.style}`);
    console.log(`🧪 [API] Stage: ${body.stage}`);
    console.log(`🧪 [API] ========================================`);

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
    console.log(`✅ [API] Job status: ${job.status}`);
    console.log(`✅ [API] Generation type: ${job.generationType}`);
    console.log(`✅ [API] Job progress: ${job.progress}%`);
    console.log(`✅ [API] Job will start processing when user polls status`);

    // Return job ID for tracking
    const response: GenerateMonsterResponse = {
      success: true,
      jobId: job.id,
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
      style: 'cute | fierce | mysterious | playful | cosmic',
      stage: 'egg | young | adult',
    },
    note: 'AI prompt is generated server-side from structured data for security',
    authentication: 'Required (Better Auth session)',
    rateLimit: `Maximum ${RATE_LIMITS.MAX_ACTIVE_JOBS_PER_USER} active jobs per user`,
  });
}
