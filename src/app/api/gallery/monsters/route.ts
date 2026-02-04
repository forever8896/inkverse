/**
 * Gallery Monsters API
 *
 * Fetches paginated list of public monsters for the community gallery.
 * Returns only minted NFTs with valid assets.
 *
 * GET /api/gallery/monsters?limit=20&offset=0&shuffle=true
 */

import { NextRequest } from 'next/server';
import { query } from '@/lib/postgres';
import { S3Service } from '@/services/s3-service';
import {
  successResponse,
  badRequestResponse,
  internalErrorResponse,
} from '@/lib/api-response';
import type { GalleryMonster } from '@/types/gallery';

interface MonsterRow {
  id: string;
  image_s3_key: string | null;
  glb_s3_key: string | null;
  stage: string; // Database value: 'egg' | 'young' | 'adult'
  owner_address: string | null;
  created_at: Date;
}

// Map database stage to gallery display stage
function mapStageToGallery(dbStage: string, hasModel: boolean): 'young' | 'young_3d' | 'adult' {
  if (dbStage === 'adult') return 'adult';
  if (hasModel) return 'young_3d';
  return 'young';
}

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const PRESIGNED_URL_EXPIRY = 7200; // 2 hours

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const shuffleParam = searchParams.get('shuffle');

    const limit = Math.min(
      Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT
    );
    const offset = Math.max(0, parseInt(offsetParam || '0', 10) || 0);
    const shuffle = shuffleParam !== 'false'; // Default to true

    // Build order clause
    const orderClause = shuffle ? 'ORDER BY RANDOM()' : 'ORDER BY mg.created_at DESC';

    // Query for completed monsters with minted NFTs
    const monstersQuery = `
      SELECT
        mg.id,
        mg.image_s3_key,
        mg.glb_s3_key,
        um.current_stage as stage,
        um.nft_owner_address as owner_address,
        mg.created_at
      FROM monster_generations mg
      JOIN user_monsters um ON mg.monster_id = um.id
      WHERE mg.status = 'completed'
        AND mg.image_s3_key IS NOT NULL
        AND um.nft_owner_address IS NOT NULL
      ${orderClause}
      LIMIT $1 OFFSET $2
    `;

    // Count total matching monsters
    const countQuery = `
      SELECT COUNT(*) as total
      FROM monster_generations mg
      JOIN user_monsters um ON mg.monster_id = um.id
      WHERE mg.status = 'completed'
        AND mg.image_s3_key IS NOT NULL
        AND um.nft_owner_address IS NOT NULL
    `;

    // Execute queries in parallel
    const [monstersResult, countResult] = await Promise.all([
      query<MonsterRow>(monstersQuery, [limit, offset]),
      query<{ total: string }>(countQuery),
    ]);

    const total = parseInt(countResult.rows[0]?.total || '0', 10);
    const hasMore = offset + monstersResult.rows.length < total;

    // Generate presigned URLs for each monster
    const s3Service = S3Service.getInstance();
    const monsters: GalleryMonster[] = await Promise.all(
      monstersResult.rows.map(async (row) => {
        let imageUrl: string | null = null;
        let modelUrl: string | null = null;

        // Generate presigned URL for image
        if (row.image_s3_key) {
          try {
            imageUrl = await s3Service.getPresignedUrl(row.image_s3_key, {
              expiresIn: PRESIGNED_URL_EXPIRY,
            });
          } catch (error) {
            console.warn(`[Gallery API] Failed to generate image URL for ${row.id}:`, error);
          }
        }

        // Generate presigned URL for 3D model (if available)
        if (row.glb_s3_key && row.stage !== 'young') {
          try {
            modelUrl = await s3Service.getPresignedUrl(row.glb_s3_key, {
              expiresIn: PRESIGNED_URL_EXPIRY,
            });
          } catch (error) {
            console.warn(`[Gallery API] Failed to generate model URL for ${row.id}:`, error);
          }
        }

        return {
          id: row.id,
          imageUrl,
          modelUrl,
          stage: mapStageToGallery(row.stage, !!row.glb_s3_key),
          ownerAddress: row.owner_address,
          createdAt: row.created_at.toISOString(),
        };
      })
    );

    // Filter out monsters with no valid URLs
    const validMonsters = monsters.filter((m) => m.imageUrl !== null);

    return successResponse({
      monsters: validMonsters,
      total,
      hasMore,
    });
  } catch (error) {
    console.error('[Gallery API] Error fetching monsters:', error);
    return internalErrorResponse(error, 'Failed to fetch gallery monsters');
  }
}
