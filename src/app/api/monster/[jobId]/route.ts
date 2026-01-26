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
import { S3Service } from '@/services/s3-service';

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
    // Fetch S3 keys to generate fresh presigned URLs (old URLs expire after 2 hours)
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
      image_s3_key: string | null;
      glb_s3_key: string | null;
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
        image_s3_key,
        glb_s3_key,
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

    // Generate fresh presigned URLs from S3 keys (old URLs expire after 2 hours)
    let freshImageUrl: string | null = null;
    let freshModelUrl: string | null = null;
    try {
      const s3Service = S3Service.getInstance();
      if (row.image_s3_key) {
        freshImageUrl = await s3Service.getPresignedUrl(row.image_s3_key, { expiresIn: 7200 });
      }
      if (row.glb_s3_key) {
        freshModelUrl = await s3Service.getPresignedUrl(row.glb_s3_key, { expiresIn: 7200 });
      }
    } catch (s3Error) {
      console.error('[Public Monster] Failed to generate presigned URLs:', s3Error);
      // Continue without URLs - IPFS CIDs can be used as fallback
    }

    // Build response - only expose public data
    const monster: PublicMonsterData = {
      id: row.id,
      style: row.style,
      stage: row.stage,
      // IPFS CIDs
      metadataCid: row.nft_metadata_cid,
      imageCid: row.nft_image_cid,
      modelCid: row.nft_model_cid,
      // Fresh presigned S3 URLs (fallback)
      imageUrl: freshImageUrl,
      modelUrl: freshModelUrl,
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
