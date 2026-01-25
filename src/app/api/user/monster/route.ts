/**
 * GET /api/user/monster
 * Returns the user's single evolving monster with full evolution state
 *
 * This endpoint provides all the data needed for:
 * - Lab page (monster preview, evolution progress)
 * - Monster viewer (full 3D/2D display, history)
 * - Lesson context (current stage, next evolution)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UserMonster, STAGE_DISPLAY_NAMES, STAGE_PROGRESS } from '@/lib/user-monster';
import { EvolutionHistory, EvolutionHistoryEntry } from '@/lib/evolution-history';
import { S3Service } from '@/services/s3-service';

export interface UserMonsterResponse {
  success: boolean;
  monster: {
    id: string;
    currentStage: string;
    displayName: string;

    // Evolution progress
    evolutionProgress: number;
    maxEvolution: number;
    canEvolve: boolean;
    nextEvolution: string | null;

    // Current assets (presigned URLs for display)
    currentImageUrl: string | null;
    currentModelUrl: string | null;

    // All assets (for historical viewing)
    assets: {
      youngImageUrl: string | null;
      youngModelUrl: string | null;  // Available even if not revealed
      adultModelUrl: string | null;
    };

    // IPFS CIDs
    youngImageCid: string | null;
    youngModelCid: string | null;
    adultModelCid: string | null;
    currentMetadataCid: string | null;

    // NFT details
    nft: {
      itemId: number | null;
      collectionId: number;
      ownerAddress: string | null;
      isMinted: boolean;
    };

    // Evolution history
    evolutionHistory: EvolutionHistoryEntry[];
    evolutionCount: number;

    // Generation attributes
    attributes: Record<string, any>;
    generationStyle: string | null;

    // Timestamps
    createdAt: string;
    updatedAt: string;
  } | null;
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, monster: null, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's monster
    const monster = await UserMonster.findByUserId(session.user.id);

    if (!monster) {
      return NextResponse.json({
        success: true,
        monster: null
      }, { status: 200 });
    }

    // Get evolution history
    const history = await EvolutionHistory.findByMonsterId(monster.id);
    const historyEntries = history.map(h => h.toTimelineEntry());

    // Generate presigned URLs for assets
    const s3Service = S3Service.getInstance();

    const generateUrl = async (s3Key: string | undefined): Promise<string | null> => {
      if (!s3Key) return null;
      try {
        return await s3Service.getPresignedUrl(s3Key, { expiresIn: 7200 }); // 2 hours
      } catch {
        console.warn(`Failed to generate presigned URL for ${s3Key}`);
        return null;
      }
    };

    // Get all asset URLs
    const [youngImageUrl, youngModelUrl, adultModelUrl] = await Promise.all([
      generateUrl(monster.youngImageS3Key),
      generateUrl(monster.youngModelS3Key),
      generateUrl(monster.adultModelS3Key)
    ]);

    // Determine current display URLs based on stage
    let currentImageUrl: string | null = youngImageUrl;
    let currentModelUrl: string | null = null;

    switch (monster.currentStage) {
      case 'young':
        currentModelUrl = null; // Not revealed yet
        break;
      case 'young_3d':
        currentModelUrl = youngModelUrl;
        break;
      case 'adult':
        currentModelUrl = adultModelUrl;
        break;
    }

    const response: UserMonsterResponse = {
      success: true,
      monster: {
        id: monster.id,
        currentStage: monster.currentStage,
        displayName: STAGE_DISPLAY_NAMES[monster.currentStage],

        // Evolution progress
        evolutionProgress: STAGE_PROGRESS[monster.currentStage],
        maxEvolution: 3,
        canEvolve: monster.getNextEvolutionStage() !== null,
        nextEvolution: monster.getNextEvolutionStage(),

        // Current assets
        currentImageUrl,
        currentModelUrl,

        // All assets
        assets: {
          youngImageUrl,
          youngModelUrl,
          adultModelUrl
        },

        // IPFS CIDs
        youngImageCid: monster.youngImageCid || null,
        youngModelCid: monster.youngModelCid || null,
        adultModelCid: monster.adultModelCid || null,
        currentMetadataCid: monster.currentMetadataCid || null,

        // NFT details
        nft: {
          itemId: monster.nftItemId || null,
          collectionId: monster.nftCollectionId,
          ownerAddress: monster.nftOwnerAddress || null,
          isMinted: monster.isMinted()
        },

        // Evolution history
        evolutionHistory: historyEntries,
        evolutionCount: historyEntries.length,

        // Generation attributes
        attributes: monster.attributes || {},
        generationStyle: monster.generationStyle || null,

        // Timestamps
        createdAt: monster.createdAt.toISOString(),
        updatedAt: monster.updatedAt.toISOString()
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('[API] Get user monster error:', error);
    return NextResponse.json(
      { success: false, monster: null, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
