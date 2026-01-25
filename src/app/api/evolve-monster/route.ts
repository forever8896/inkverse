/**
 * POST /api/evolve-monster
 * Triggers monster evolution to a new stage
 *
 * Handles:
 * - young_3d: Reveal existing 3D model (no generation)
 * - adult: Generate new adult 3D model and evolve
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserMonster, EvolutionStage, STAGE_TRANSITIONS } from '@/lib/user-monster';
import { EvolutionHistory } from '@/lib/evolution-history';
import { NFTsPalletService } from '@/services/nfts-pallet-service';

export interface EvolveMonsterRequest {
  stage: 'young_3d' | 'adult';
  evolutionMilestone?: string;
  walletAddress: string;
  lessonId?: number;
  chapterId?: number;
  stepId?: number;
}

export interface EvolveMonsterResponse {
  success: boolean;
  monsterId?: string;
  newStage?: EvolutionStage;
  newMetadataCid?: string;
  txHash?: string;
  jobId?: string; // For adult stage (generation required)
  error?: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: EvolveMonsterRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const { stage, evolutionMilestone, walletAddress, lessonId, chapterId, stepId } = body;

    // Validate stage
    if (!stage || !['young_3d', 'adult'].includes(stage)) {
      return NextResponse.json(
        { success: false, error: 'stage must be young_3d or adult', code: 'INVALID_STAGE' },
        { status: 400 }
      );
    }

    // Validate wallet address
    if (!walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please connect your Polkadot wallet to evolve your monster',
          code: 'WALLET_REQUIRED'
        },
        { status: 400 }
      );
    }

    if (!NFTsPalletService.validateSS58Address(walletAddress)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid wallet address format',
          code: 'INVALID_WALLET_ADDRESS'
        },
        { status: 400 }
      );
    }

    // Get user's monster
    const monster = await UserMonster.findByUserId(session.user.id);

    if (!monster) {
      return NextResponse.json(
        {
          success: false,
          error: 'No monster found. Complete the young stage first to create your monster.',
          code: 'NO_MONSTER'
        },
        { status: 404 }
      );
    }

    // Validate evolution transition
    const validTransitions = STAGE_TRANSITIONS[monster.currentStage];
    if (!validTransitions.includes(stage as EvolutionStage)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot evolve from ${monster.currentStage} to ${stage}. Valid transitions: ${validTransitions.join(', ') || 'none'}`,
          code: 'INVALID_TRANSITION'
        },
        { status: 400 }
      );
    }

    // Verify wallet matches NFT owner
    if (monster.nftOwnerAddress && monster.nftOwnerAddress !== walletAddress) {
      return NextResponse.json(
        {
          success: false,
          error: 'Connected wallet does not match NFT owner address',
          code: 'WALLET_MISMATCH'
        },
        { status: 403 }
      );
    }

    // Check if monster is minted
    if (!monster.isMinted()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Monster has not been minted yet. Complete the minting process first.',
          code: 'NOT_MINTED'
        },
        { status: 400 }
      );
    }

    console.log(`[Evolve] Starting evolution for monster ${monster.id} from ${monster.currentStage} to ${stage}`);

    // Handle different evolution types
    if (stage === 'young_3d') {
      // Reveal existing 3D - no generation needed
      return handleYoung3DReveal(monster, evolutionMilestone, { lessonId, chapterId, stepId });
    }

    if (stage === 'adult') {
      // Generate new adult 3D
      return handleAdultGeneration(monster, evolutionMilestone, walletAddress, { lessonId, chapterId, stepId });
    }

    return NextResponse.json(
      { success: false, error: 'Unexpected stage', code: 'UNEXPECTED_STAGE' },
      { status: 400 }
    );

  } catch (error) {
    console.error('[API] Evolve monster error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * Handle young_3d reveal - expose existing 3D model without generation
 */
async function handleYoung3DReveal(
  monster: UserMonster,
  evolutionMilestone?: string,
  lessonContext?: { lessonId?: number; chapterId?: number; stepId?: number }
): Promise<NextResponse<EvolveMonsterResponse>> {
  try {
    // Check if 3D model exists in S3
    if (!monster.youngModelS3Key) {
      return NextResponse.json(
        {
          success: false,
          error: '3D model not found. The monster may need to be regenerated.',
          code: 'MODEL_NOT_FOUND'
        },
        { status: 400 }
      );
    }

    // Import services dynamically for tree-shaking
    const { S3Service } = await import('@/services/s3-service');
    const { NFTMetadataService } = await import('@/services/nft-metadata-service');

    const s3Service = S3Service.getInstance();
    const metadataService = NFTMetadataService.getInstance();

    // Get 3D model from S3 and upload to IPFS
    console.log(`[Evolve] Fetching 3D model from S3: ${monster.youngModelS3Key}`);
    const modelBuffer = await s3Service.downloadFile(monster.youngModelS3Key);

    console.log(`[Evolve] Uploading 3D model to IPFS`);
    const modelCid = await metadataService.uploadAsset(modelBuffer, 'model.glb', 'model/gltf-binary');

    // Get existing evolution history
    const existingHistory = await EvolutionHistory.getMetadataHistory(monster.id);

    // Create new metadata with evolution history
    const newMetadata = {
      name: `Ink Monster #${monster.nftItemId}`,
      description: 'A creature born from ink! smart contracts, evolved through learning.',
      image: `ipfs://${monster.youngImageCid}`,
      animation_url: `ipfs://${modelCid}`,
      external_url: `https://inkverse.app/monster/${monster.nftItemId}`,
      current_stage: 'young_3d',
      evolution_count: existingHistory.length + 1,
      evolution_history: [
        ...existingHistory,
        {
          stage: 'young_3d',
          milestone: evolutionMilestone || '3D Model Unlocked',
          timestamp: new Date().toISOString(),
          assets: { model_cid: modelCid }
        }
      ],
      attributes: [
        { trait_type: 'Stage', value: 'Young (3D)' },
        { trait_type: 'Evolution Count', value: existingHistory.length + 1 },
        ...Object.entries(monster.attributes || {}).map(([key, value]) => ({
          trait_type: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value)
        }))
      ],
      inkverse: {
        version: '1.0.0'
      }
    };

    // Upload metadata to IPFS
    console.log(`[Evolve] Uploading metadata to IPFS`);
    const metadataCid = await metadataService.uploadMetadata(newMetadata);

    // Update NFT metadata on-chain
    console.log(`[Evolve] Updating on-chain NFT metadata`);
    const nftsService = NFTsPalletService.getInstance();
    const txResult = await nftsService.setMetadata(
      monster.nftCollectionId,
      monster.nftItemId!,
      metadataCid
    );

    // Update monster record
    await monster.update({
      currentStage: 'young_3d',
      youngModelCid: modelCid,
      currentMetadataCid: metadataCid
    });

    // Record evolution in history
    await EvolutionHistory.create({
      monsterId: monster.id,
      stage: 'young_3d',
      milestoneLabel: evolutionMilestone,
      assetsAdded: { model_cid: modelCid },
      metadataCid,
      txHash: txResult.txHash,
      blockHash: txResult.blockHash,
      lessonId: lessonContext?.lessonId,
      chapterId: lessonContext?.chapterId,
      stepId: lessonContext?.stepId
    });

    console.log(`[Evolve] Successfully evolved monster ${monster.id} to young_3d`);

    return NextResponse.json({
      success: true,
      monsterId: monster.id,
      newStage: 'young_3d',
      newMetadataCid: metadataCid,
      txHash: txResult.txHash
    }, { status: 200 });

  } catch (error) {
    console.error('[Evolve] young_3d reveal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reveal 3D model. Please try again.',
        code: 'REVEAL_FAILED'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle adult generation - requires new 3D model generation
 */
async function handleAdultGeneration(
  monster: UserMonster,
  evolutionMilestone?: string,
  walletAddress?: string,
  lessonContext?: { lessonId?: number; chapterId?: number; stepId?: number }
): Promise<NextResponse<EvolveMonsterResponse>> {
  try {
    // Import GenerationJob for creating a new generation job
    const { GenerationJob } = await import('@/lib/generation-job');

    // Create generation job for adult 3D model
    const job = await GenerationJob.create({
      userId: monster.userId,
      prompt: monster.generationPrompt || 'Adult evolved monster',
      style: (monster.generationStyle as any) || 'cute',
      stage: 'adult',
      generationType: 'full', // Generate new 3D model
      nftOwnerAddress: walletAddress,
      monsterId: monster.id,
      evolutionType: 'generate_evolve',
      evolutionMilestone: evolutionMilestone || 'Adult Form Achieved'
    });

    // Start the evolution workflow (original working workflow)
    const { start } = await import('workflow/api');
    const { evolveMonster } = await import('@/workflows/evolve-monster');

    const run = await start(evolveMonster, [{
      jobId: job.id,
      monsterId: monster.id,
      targetStage: 'adult',
      evolutionMilestone: evolutionMilestone || 'Adult Form Achieved',
      lessonContext
    }]);

    // Store workflow run ID
    await job.update({ workflowRunId: run.runId });

    console.log(`[Evolve] Started adult evolution workflow for monster ${monster.id}, job ${job.id}`);

    return NextResponse.json({
      success: true,
      monsterId: monster.id,
      jobId: job.id,
      newStage: 'adult'
    }, { status: 202 }); // 202 Accepted - processing asynchronously

  } catch (error) {
    console.error('[Evolve] adult generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start adult evolution. Please try again.',
        code: 'GENERATION_FAILED'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/evolve-monster',
    description: 'Trigger monster evolution to a new stage',
    parameters: {
      stage: 'young_3d | adult - Target evolution stage',
      evolutionMilestone: '(optional) Human-readable milestone label for history',
      walletAddress: '(required) SS58 Polkadot wallet address (must match NFT owner)',
      lessonId: '(optional) Lesson ID that triggered this evolution',
      chapterId: '(optional) Chapter ID that triggered this evolution',
      stepId: '(optional) Step ID that triggered this evolution'
    },
    stageDetails: {
      young_3d: 'Reveals existing 3D model (generated at young stage but hidden). Immediate, no generation.',
      adult: 'Generates new adult 3D model. Asynchronous, returns jobId for polling.'
    },
    authentication: 'Required (Better Auth session)',
    validation: {
      mustHaveMonster: 'User must have completed young stage first',
      validTransition: 'young -> young_3d -> adult',
      walletMustMatch: 'Connected wallet must match NFT owner address'
    }
  });
}
