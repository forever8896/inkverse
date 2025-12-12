/**
 * POST /api/generate-monster
 * Creates a new monster generation job and returns job ID
 * Does NOT perform actual AI generation - that happens in background worker
 */

import { NextRequest, NextResponse } from 'next/server';
import { GenerationJob } from '@/lib/generation-job';
import { auth } from '@/lib/auth';
import { RATE_LIMITS } from '@/config/constants';
import { generatePromptFromStructuredData, type GenerateMonsterRequest } from '@/lib/monster-prompts';
import { NFTsPalletService } from '@/services/nfts-pallet-service';

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

    // Validate wallet address for NFT minting
    const walletAddress = body.walletAddress;
    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please connect your Polkadot wallet to generate a monster',
          code: 'WALLET_REQUIRED'
        },
        { status: 400 }
      );
    }

    // Validate SS58 address format
    if (!(await NFTsPalletService.validateSS58Address(walletAddress))) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format. Please reconnect your wallet.',
          code: 'INVALID_WALLET_ADDRESS'
        },
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

    // Check for completed sets limit and progression
    const completedSets = await GenerationJob.countCompletedSets(session.user.id);

    // Rule 1: Max 1 Young Monster
    if (body.stage === 'young' && completedSets.young >= 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have a Young monster. You can now evolve it to Adult.',
        },
        { status: 403 }
      );
    }

    // Rule 2: Max 1 Adult Monster
    if (body.stage === 'adult' && completedSets.adult >= 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'You already have an Adult monster. Limit reached.',
        },
        { status: 403 }
      );
    }

    // Rule 3: Progression (Young -> Adult)
    if (body.stage === 'adult' && completedSets.young === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'You must generate a Young monster first before creating an Adult.',
        },
        { status: 400 }
      );
    }

    // Helper to safely check workflow status (Fix #6)
    const verifyJobWorkflow = async (job: GenerationJob): Promise<boolean> => {
      if (!job.workflowRunId) return true;
      
      try {
        const { getRun } = await import('workflow/api');
        const run = await getRun(job.workflowRunId);
        const status = await run.status;
        
        if (status === 'running') {
          return true;
        } else {
          // Workflow stopped but job thinks it's active -> Failed
          console.log(`⚠️ Job ${job.id} is ${job.status} but workflow is ${status}. Marking failed.`);
          await job.fail(`Workflow stopped unexpectedly: ${status}`);
          return false;
        }
      } catch (error: any) {
        console.warn(`Unable to verify workflow ${job.workflowRunId}:`, error);
        // If workflow run not found, mark job as failed so we can create a new one
        if (error?.name === 'WorkflowRunNotFoundError' || error?.message?.includes('not found')) {
          console.log(`⚠️ Workflow ${job.workflowRunId} not found. Marking job ${job.id} as failed.`);
          await job.fail('Workflow run no longer exists');
          return false;
        }
        // Other network errors - assume it's running (don't fail job)
        return true;
      }
    };

    // Check for existing active job (duplicate prevention)
    const existingJob = await GenerationJob.findActive({
      userId: session.user.id
    });

    if (existingJob && existingJob.workflowRunId) {
      // Verify workflow run actually exists before resuming
      const isRunning = await verifyJobWorkflow(existingJob);

      if (isRunning) {
        console.log(`♻️  [API] Resuming existing job ${existingJob.id} with run ${existingJob.workflowRunId}`);
        return NextResponse.json({
          success: true,
          jobId: existingJob.id,
          runId: existingJob.workflowRunId,
          resumed: true
        }, { status: 200 });
      }
      // If not running, verifyJobWorkflow marked it as failed.
      // We proceed to create a new job below.
    }

    // Generate AI prompt server-side from structured data
    const aiPrompt = generatePromptFromStructuredData(body);
    console.log(`[API] Creating monster generation job - userId: ${session.user.id}, stage: ${body.stage}, style: ${body.style}`);

    // Prepare lesson context
    const lessonContext = (body.lessonId && body.chapterId && body.stepId) ? {
      lessonId: body.lessonId,
      chapterId: body.chapterId,
      stepId: body.stepId
    } : undefined;

    // Create the generation job
    // FIX #4: Store wallet address at job creation time (not at mint time)
    // This ensures security - we use the wallet from when the job was created
    let job;
    try {
      job = await GenerationJob.createWithTrigger({
        userId: session.user.id,
        prompt: aiPrompt,
        style: body.style,
        stage: body.stage,
        generationType,
        nftOwnerAddress: walletAddress,
      }, lessonContext);
    } catch (error: any) {
      // Handle race condition (unique constraint violation)
      if (error?.code === '23505') {
        console.warn(`⚠️ [API] Race condition detected for user ${session.user.id} - fetching existing active job`);
        const existingActiveJob = await GenerationJob.findActive({ userId: session.user.id });
        
        if (existingActiveJob) {
          // Verify it's actually running (Fix #6)
          const isRunning = await verifyJobWorkflow(existingActiveJob);
          
          if (isRunning) {
            return NextResponse.json({
              success: true,
              jobId: existingActiveJob.id,
              runId: existingActiveJob.workflowRunId,
              resumed: true,
              message: 'Existing active job found'
            }, { status: 200 });
          }
          // If not running (and now marked failed), we can't easily retry here without recursion.
          // Let the client handle the failed state or retry.
        }
      }
      throw error;
    }

    // Check if we resumed an existing job (Atomic Trigger Fix)
    if (job.workflowRunId) {
      console.log(`♻️  [API] Atomic trigger found existing job ${job.id} with run ${job.workflowRunId}`);

      // Verify workflow status (Fix #6)
      const isRunning = await verifyJobWorkflow(job);

      if (isRunning) {
        // Job is actively running, return it for polling
        return NextResponse.json({
          success: true,
          jobId: job.id,
          runId: job.workflowRunId,
          resumed: true
        }, { status: 200 });
      }

      // Job was marked failed by verifyJobWorkflow
      // Re-fetch to get the updated status and let client know
      const updatedJob = await GenerationJob.findById(job.id);
      return NextResponse.json({
        success: false,
        error: 'Previous generation failed. Please try again.',
        jobId: job.id,
        status: updatedJob?.status || 'failed_permanent'
      }, { status: 409 });
    }

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
      // NFT minting
      walletAddress: '(required) SS58 Polkadot wallet address for NFT ownership',
    },
    note: 'AI prompt is generated server-side from structured data for security. Wallet address is required for NFT minting.',
    authentication: 'Required (Better Auth session)',
    rateLimit: `Maximum ${RATE_LIMITS.MAX_ACTIVE_JOBS_PER_USER} active jobs per user`,
  });
}
