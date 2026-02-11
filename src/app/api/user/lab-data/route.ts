import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { getLessonById } from '@/lib/lessons-server';
import { S3Service } from '@/services/s3-service';

export interface UserMonster {
  id: string;
  imageUrl: string | null;
  modelUrl: string | null;
  stage: 'egg' | 'young' | 'adult';
  status: string;
  // NFT data (if minted)
  nftItemId: number | null;
  nftCollectionId: number | null;
  nftOwnerAddress: string | null;
  nftMintedAt: string | null;
}

export interface UserProgress {
  lessonId: number;
  chapterId: number;
  stepId: number;
}

export interface LabDataResponse {
  success: boolean;
  data?: {
    currentPosition: UserProgress | null;
    monster: UserMonster | null;
  };
  error?: string;
}

// GET /api/user/lab-data - Get data needed for the lab page
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session) {
      return unauthorizedResponse();
    }

    const userId = session.user.id;
    console.log('[Lab Data] Fetching data for user:', userId);

    // Get the most recent step the user visited (where they should continue)
    // Use updated_at (not created_at) so revisiting a step or progressing
    // forward correctly reflects the user's current position.
    const { rows: positionRows } = await query(`
      SELECT
        lesson_id,
        chapter_id,
        step_id
      FROM user_step_progress
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1
    `, [userId]);

    console.log('[Lab Data] Position rows:', positionRows);

    // Get user's monster from user_monsters table (canonical source)
    // This ensures consistency with /api/user/monster endpoint
    const { rows: monsterRows } = await query(`
      SELECT
        id,
        current_stage,
        young_image_s3_key,
        young_model_s3_key,
        adult_model_s3_key,
        nft_item_id,
        nft_collection_id,
        nft_owner_address,
        created_at
      FROM user_monsters
      WHERE user_id = $1
      LIMIT 1
    `, [userId]);

    // Convert step_id (global ID) to step position (1-indexed within chapter)
    // URL routing uses position, not ID: /lesson/1/2/2 means lesson 1, chapter 2, step position 2
    let currentPosition: UserProgress | null = null;

    if (positionRows[0]) {
      const lessonId = positionRows[0].lesson_id;
      const chapterId = positionRows[0].chapter_id;
      const stepId = positionRows[0].step_id;

      // Look up the lesson to find step position within chapter
      const lesson = getLessonById(lessonId);
      const chapter = lesson?.chapters?.find(c => c.id === chapterId);

      if (chapter) {
        // Find the step's position (index + 1) within the chapter
        const stepIndex = chapter.steps.findIndex(s => s.id === stepId);
        const stepPosition = stepIndex >= 0 ? stepIndex + 1 : 1;

        currentPosition = {
          lessonId,
          chapterId,
          stepId: stepPosition, // Return position, not ID
        };
      } else {
        // Fallback if chapter not found
        currentPosition = {
          lessonId,
          chapterId,
          stepId: 1,
        };
      }
    }

    // Generate fresh presigned URLs from S3 keys
    let monster: UserMonster | null = null;
    if (monsterRows[0]) {
      const row = monsterRows[0];
      let imageUrl: string | null = null;
      let modelUrl: string | null = null;

      // Generate fresh presigned URLs (old ones expire after 2 hours)
      try {
        const s3Service = S3Service.getInstance();

        // Always get image URL if available
        if (row.young_image_s3_key) {
          imageUrl = await s3Service.getPresignedUrl(row.young_image_s3_key, { expiresIn: 7200 });
        }

        // Get model URL based on current stage
        const stage = row.current_stage;
        if (stage === 'young_3d' && row.young_model_s3_key) {
          modelUrl = await s3Service.getPresignedUrl(row.young_model_s3_key, { expiresIn: 7200 });
        } else if (stage === 'adult' && row.adult_model_s3_key) {
          modelUrl = await s3Service.getPresignedUrl(row.adult_model_s3_key, { expiresIn: 7200 });
        }
      } catch (s3Error) {
        console.error('[Lab Data] Failed to generate presigned URLs:', s3Error);
        // Continue without URLs - the UI will show a placeholder
      }

      monster = {
        id: row.id,
        imageUrl,
        modelUrl,
        stage: row.current_stage,
        status: 'completed', // user_monsters only contains completed monsters
        nftItemId: row.nft_item_id,
        nftCollectionId: row.nft_collection_id,
        nftOwnerAddress: row.nft_owner_address,
        nftMintedAt: row.created_at?.toISOString() ?? null,
      };
    }

    return successResponse({
      currentPosition,
      monster,
    });

  } catch (error) {
    logError('Lab Data API', error);
    return internalErrorResponse(error, 'Failed to fetch lab data');
  }
}
