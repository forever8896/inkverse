import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import {
  successResponse,
  unauthorizedResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import { logError } from '@/types/errors';
import type { MonsterStage, MonsterStyle } from '@/lib/ipfs-utils';
import type { EvolutionStage } from '@/lib/user-monster';
import { S3Service } from '@/services/s3-service';

// ============================================================================
// Types
// ============================================================================

export interface EvolutionHistoryEntry {
  id: string;
  stage: EvolutionStage;
  milestone: string | null;
  timestamp: string;
  assets: {
    image_cid?: string;
    model_cid?: string;
  } | null;
  txHash: string | null;
}

export interface EvolutionData {
  currentStage: EvolutionStage;
  evolutionHistory: EvolutionHistoryEntry[];
  nextEvolution: {
    stage: EvolutionStage;
    requiresGeneration: boolean;
    canEvolve: boolean;
  } | null;
  monsterId: string;
  nftItemId?: number;
  nftOwnerAddress?: string;
}

export interface MonsterData {
  id: string;
  style: MonsterStyle;
  stage: MonsterStage;
  prompt: string;
  // IPFS CIDs
  metadataCid: string | null;
  imageCid: string | null;
  modelCid: string | null;
  // S3 URLs (fallback) - modelUrl only included if evolution stage allows
  imageUrl: string | null;
  modelUrl: string | null;
  // NFT on-chain data
  nft: {
    itemId: number;
    collectionId: number;
    ownerAddress: string;
    txHash: string;
    blockHash: string;
    mintedAt: string;
  } | null;
  // Timestamps
  createdAt: string;
  completedAt: string;
  // Evolution data
  evolution?: EvolutionData;
}

export interface MyMonsterResponse {
  success: boolean;
  data?: {
    monster: MonsterData;
  };
  error?: string;
}

// ============================================================================
// GET /api/my-monster - Get user's latest minted NFT
// ============================================================================

// Stage transitions for determining next evolution
const STAGE_TRANSITIONS: Record<EvolutionStage, EvolutionStage | null> = {
  'young': 'young_3d',
  'young_3d': 'adult',
  'adult': null
};

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;
    console.log('[My Monster] Fetching NFT for user:', userId);

    // Get user's monster from user_monsters table (evolution tracking)
    const { rows: monsterRows } = await query<{
      id: string;
      current_stage: EvolutionStage;
      nft_item_id: number | null;
      nft_collection_id: number;
      nft_owner_address: string | null;
      current_metadata_cid: string | null;
      young_image_s3_key: string | null;
      young_model_s3_key: string | null;
      young_image_cid: string | null;
      young_model_cid: string | null;
      generation_prompt: string | null;
      generation_style: string | null;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT * FROM user_monsters WHERE user_id = $1`,
      [userId]
    );

    // If no user_monster, fall back to monster_generations
    if (monsterRows.length === 0) {
      return await getFallbackFromGenerations(userId);
    }

    const userMonster = monsterRows[0];

    // Get the latest completed generation job for S3 keys
    // We fetch S3 keys instead of URLs so we can generate fresh presigned URLs
    const { rows: genRows } = await query<{
      id: string;
      style: MonsterStyle;
      stage: MonsterStage;
      prompt: string;
      nft_item_id: number;
      nft_collection_id: number;
      nft_metadata_cid: string | null;
      nft_image_cid: string | null;
      nft_model_cid: string | null;
      nft_tx_hash: string;
      nft_block_hash: string;
      nft_minted_at: Date;
      nft_owner_address: string;
      image_s3_key: string | null;
      glb_s3_key: string | null;
      created_at: Date;
      completed_at: Date;
    }>(
      `SELECT * FROM monster_generations
       WHERE user_id = $1 AND status = 'completed' AND nft_minted_at IS NOT NULL
       ORDER BY nft_minted_at DESC LIMIT 1`,
      [userId]
    );

    // Get evolution history
    const { rows: historyRows } = await query<{
      id: string;
      stage: EvolutionStage;
      milestone_label: string | null;
      evolved_at: Date;
      assets_added: any;
      tx_hash: string | null;
    }>(
      `SELECT id, stage, milestone_label, evolved_at, assets_added, tx_hash
       FROM monster_evolution_history
       WHERE monster_id = $1
       ORDER BY evolved_at ASC`,
      [userMonster.id]
    );

    const genRow = genRows[0];
    const currentStage = userMonster.current_stage;

    // Determine if 3D model should be shown based on evolution stage
    // young = 2D only (3D hidden), young_3d/adult = 3D visible
    const shouldShowModel = currentStage === 'young_3d' || currentStage === 'adult';

    // Generate fresh presigned URLs from S3 keys (old URLs expire after 2 hours)
    let freshImageUrl: string | null = null;
    let freshModelUrl: string | null = null;
    try {
      const s3Service = S3Service.getInstance();
      if (genRow?.image_s3_key) {
        freshImageUrl = await s3Service.getPresignedUrl(genRow.image_s3_key, { expiresIn: 7200 });
      }
      if (shouldShowModel && genRow?.glb_s3_key) {
        freshModelUrl = await s3Service.getPresignedUrl(genRow.glb_s3_key, { expiresIn: 7200 });
      }
    } catch (s3Error) {
      console.error('[My Monster] Failed to generate presigned URLs:', s3Error);
      // Continue without URLs - IPFS CIDs can be used as fallback
    }

    // Build evolution history
    const evolutionHistory: EvolutionHistoryEntry[] = historyRows.map(h => ({
      id: h.id,
      stage: h.stage,
      milestone: h.milestone_label,
      timestamp: h.evolved_at.toISOString(),
      assets: h.assets_added,
      txHash: h.tx_hash
    }));

    // Determine next evolution
    const nextStage = STAGE_TRANSITIONS[currentStage];
    const nextEvolution = nextStage ? {
      stage: nextStage,
      requiresGeneration: nextStage === 'adult', // adult requires new 3D generation
      canEvolve: true
    } : null;

    // Build response
    const monster: MonsterData = {
      id: genRow?.id || userMonster.id,
      style: (genRow?.style || userMonster.generation_style || 'cute') as MonsterStyle,
      stage: (genRow?.stage || 'young') as MonsterStage,
      prompt: genRow?.prompt || userMonster.generation_prompt || '',
      // IPFS CIDs - use current metadata CID from user_monster if available
      metadataCid: userMonster.current_metadata_cid || genRow?.nft_metadata_cid || null,
      imageCid: userMonster.young_image_cid || genRow?.nft_image_cid || null,
      // Model CID only if evolution stage allows
      modelCid: shouldShowModel ? (userMonster.young_model_cid || genRow?.nft_model_cid || null) : null,
      // S3 fallback URLs - use fresh presigned URLs
      imageUrl: freshImageUrl,
      modelUrl: freshModelUrl,
      // NFT on-chain data
      nft: genRow ? {
        itemId: userMonster.nft_item_id || genRow.nft_item_id,
        collectionId: userMonster.nft_collection_id || genRow.nft_collection_id,
        ownerAddress: userMonster.nft_owner_address || genRow.nft_owner_address,
        txHash: genRow.nft_tx_hash,
        blockHash: genRow.nft_block_hash,
        mintedAt: genRow.nft_minted_at.toISOString(),
      } : null,
      // Timestamps
      createdAt: (genRow?.created_at || userMonster.created_at).toISOString(),
      completedAt: (genRow?.completed_at || userMonster.updated_at).toISOString(),
      // Evolution data
      evolution: {
        currentStage,
        evolutionHistory,
        nextEvolution,
        monsterId: userMonster.id,
        nftItemId: userMonster.nft_item_id || undefined,
        nftOwnerAddress: userMonster.nft_owner_address || undefined
      }
    };

    return successResponse({ monster });
  } catch (error) {
    logError('My Monster API', error);
    return internalErrorResponse(error, 'Failed to fetch monster data');
  }
}

// Fallback for users without user_monsters record (legacy)
async function getFallbackFromGenerations(userId: string) {
  const { rows } = await query<{
    id: string;
    style: MonsterStyle;
    stage: MonsterStage;
    prompt: string;
    nft_item_id: number;
    nft_collection_id: number;
    nft_metadata_cid: string | null;
    nft_image_cid: string | null;
    nft_model_cid: string | null;
    nft_tx_hash: string;
    nft_block_hash: string;
    nft_minted_at: Date;
    nft_owner_address: string;
    image_s3_key: string | null;
    created_at: Date;
    completed_at: Date;
  }>(
    `SELECT * FROM monster_generations
     WHERE user_id = $1 AND status = 'completed' AND nft_minted_at IS NOT NULL
     ORDER BY nft_minted_at DESC LIMIT 1`,
    [userId]
  );

  if (rows.length === 0) {
    return notFoundResponse('Minted monster');
  }

  const row = rows[0];

  // Generate fresh presigned URL from S3 key
  let freshImageUrl: string | null = null;
  try {
    if (row.image_s3_key) {
      const s3Service = S3Service.getInstance();
      freshImageUrl = await s3Service.getPresignedUrl(row.image_s3_key, { expiresIn: 7200 });
    }
  } catch (s3Error) {
    console.error('[My Monster Fallback] Failed to generate presigned URL:', s3Error);
  }

  // Legacy: assume young stage (no 3D in NFT)
  const monster: MonsterData = {
    id: row.id,
    style: row.style,
    stage: row.stage,
    prompt: row.prompt,
    metadataCid: row.nft_metadata_cid,
    imageCid: row.nft_image_cid,
    modelCid: null, // Don't show model for legacy
    imageUrl: freshImageUrl,
    modelUrl: null, // Don't show model for legacy
    nft: {
      itemId: row.nft_item_id,
      collectionId: row.nft_collection_id,
      ownerAddress: row.nft_owner_address,
      txHash: row.nft_tx_hash,
      blockHash: row.nft_block_hash,
      mintedAt: row.nft_minted_at.toISOString(),
    },
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at.toISOString(),
  };

  return successResponse({ monster });
}
