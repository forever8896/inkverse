import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { successResponse, unauthorizedResponse, internalErrorResponse } from '@/lib/api-response';
import { logError } from '@/types/errors';
import { getLessonById } from '@/lib/lessons-server';

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
    // This returns the last step they were on, based on when they visited it
    const { rows: positionRows } = await query(`
      SELECT
        lesson_id,
        chapter_id,
        step_id
      FROM user_step_progress
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    console.log('[Lab Data] Position rows:', positionRows);

    // Get user's latest completed monster with NFT data
    const { rows: monsterRows } = await query(`
      SELECT
        id,
        image_url,
        glb_url,
        stage,
        status,
        nft_item_id,
        nft_collection_id,
        nft_owner_address,
        nft_minted_at
      FROM monster_generations
      WHERE user_id = $1
        AND status = 'completed'
        AND (image_url IS NOT NULL OR glb_url IS NOT NULL)
      ORDER BY
        CASE WHEN nft_minted_at IS NOT NULL THEN 0 ELSE 1 END,
        completed_at DESC
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

    const monster: UserMonster | null = monsterRows[0]
      ? {
          id: monsterRows[0].id,
          imageUrl: monsterRows[0].image_url,
          modelUrl: monsterRows[0].glb_url,
          stage: monsterRows[0].stage,
          status: monsterRows[0].status,
          nftItemId: monsterRows[0].nft_item_id,
          nftCollectionId: monsterRows[0].nft_collection_id,
          nftOwnerAddress: monsterRows[0].nft_owner_address,
          nftMintedAt: monsterRows[0].nft_minted_at?.toISOString() ?? null,
        }
      : null;

    return successResponse({
      currentPosition,
      monster,
    });

  } catch (error) {
    logError('Lab Data API', error);
    return internalErrorResponse(error, 'Failed to fetch lab data');
  }
}
