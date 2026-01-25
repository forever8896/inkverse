import { NextRequest } from 'next/server';
import { query } from '@/lib/postgres';
import {
  successResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import { logError } from '@/types/errors';
import type { MonsterStage, MonsterStyle } from '@/lib/ipfs-utils';

// ============================================================================
// Types
// ============================================================================

export interface PublicMonsterData {
  id: string;
  style: MonsterStyle;
  stage: MonsterStage;
  // IPFS CIDs (for metadata resolution)
  metadataCid: string | null;
  imageCid: string | null;
  modelCid: string | null;
  // Public S3 URLs (fallback)
  imageUrl: string | null;
  modelUrl: string | null;
  // NFT on-chain data (public info only)
  nft: {
    itemId: number;
    collectionId: number;
    ownerAddress: string;
    mintedAt: string;
  } | null;
  // Timestamps
  createdAt: string;
}

export interface PublicMonsterResponse {
  success: boolean;
  data?: {
    monster: PublicMonsterData;
  };
  error?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Validate UUID format
 */
function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ============================================================================
// GET /api/monster/[jobId] - Get public monster data
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate jobId format
    if (!jobId || !isValidUUID(jobId)) {
      return badRequestResponse('Invalid monster ID format');
    }

    console.log('[Public Monster] Fetching monster:', jobId);

    // Get monster data - limited fields for public view
    // Note: We don't expose user_id, S3 keys, or internal data
    const { rows } = await query<{
      id: string;
      style: MonsterStyle;
      stage: MonsterStage;
      nft_item_id: number | null;
      nft_collection_id: number | null;
      nft_metadata_cid: string | null;
      nft_image_cid: string | null;
      nft_model_cid: string | null;
      nft_minted_at: Date | null;
      nft_owner_address: string | null;
      image_url: string | null;
      glb_url: string | null;
      created_at: Date;
    }>(
      `SELECT
        id,
        style,
        stage,
        nft_item_id,
        nft_collection_id,
        nft_metadata_cid,
        nft_image_cid,
        nft_model_cid,
        nft_minted_at,
        nft_owner_address,
        image_url,
        glb_url,
        created_at
      FROM monster_generations
      WHERE id = $1
        AND status = 'completed'`,
      [jobId]
    );

    // Monster not found
    if (rows.length === 0) {
      return notFoundResponse('Monster');
    }

    const row = rows[0];

    // Build response - only expose public data
    const monster: PublicMonsterData = {
      id: row.id,
      style: row.style,
      stage: row.stage,
      // IPFS CIDs
      metadataCid: row.nft_metadata_cid,
      imageCid: row.nft_image_cid,
      modelCid: row.nft_model_cid,
      // Public S3 URLs (fallback)
      imageUrl: row.image_url,
      modelUrl: row.glb_url,
      // NFT data (only if minted)
      nft: row.nft_minted_at
        ? {
            itemId: row.nft_item_id!,
            collectionId: row.nft_collection_id!,
            ownerAddress: row.nft_owner_address!,
            mintedAt: row.nft_minted_at.toISOString(),
          }
        : null,
      // Timestamps
      createdAt: row.created_at.toISOString(),
    };

    return successResponse({ monster });
  } catch (error) {
    logError('Public Monster API', error);
    return internalErrorResponse(error, 'Failed to fetch monster data');
  }
}
