import { notFound } from 'next/navigation';
import { query } from '@/lib/postgres';
import { MonsterViewerPage } from '@/components/nft-viewer';
import type { MonsterData, EvolutionData, EvolutionHistoryEntry } from '@/app/api/my-monster/route';
import type { MonsterStage, MonsterStyle } from '@/lib/ipfs-utils';
import type { EvolutionStage } from '@/lib/user-monster';
import { S3Service } from '@/services/s3-service';

// Stage transitions for determining next evolution
const STAGE_TRANSITIONS: Record<EvolutionStage, EvolutionStage | null> = {
  'young': 'young_3d',
  'young_3d': 'adult',
  'adult': null
};

interface PublicMonsterPageProps {
  params: Promise<{ jobId: string }>;
}

/**
 * Validate UUID format
 */
function isValidUUID(value: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Generate dynamic metadata for SEO and social sharing
 */
export async function generateMetadata({ params }: PublicMonsterPageProps) {
  const { jobId } = await params;

  return {
    title: `Monster | Monsters Ink!`,
    description: 'Check out this amazing creature from Monsters Ink! - Learn ink! smart contracts on Polkadot.',
    openGraph: {
      title: `Monster | Monsters Ink!`,
      description: 'Check out this amazing creature from Monsters Ink! - Learn ink! smart contracts on Polkadot.',
      type: 'website',
      url: `/monster/${jobId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `Monster | Monsters Ink!`,
      description: 'Check out this amazing creature from Monsters Ink!',
    },
  };
}

/**
 * Server Component for the public monster viewer.
 * No authentication required - displays limited public data.
 */
export default async function PublicMonsterPage({ params }: PublicMonsterPageProps) {
  const { jobId } = await params;

  // Validate jobId format
  if (!jobId || !isValidUUID(jobId)) {
    notFound();
  }

  // Fetch monster data server-side
  let monster: MonsterData | null = null;
  let evolutionData: EvolutionData | undefined = undefined;

  try {
    const { rows } = await query<{
      id: string;
      user_id: string;
      style: MonsterStyle;
      stage: MonsterStage;
      nft_item_id: number | null;
      nft_collection_id: number | null;
      nft_metadata_cid: string | null;
      nft_image_cid: string | null;
      nft_model_cid: string | null;
      nft_tx_hash: string | null;
      nft_block_hash: string | null;
      nft_minted_at: Date | null;
      nft_owner_address: string | null;
      image_s3_key: string | null;
      glb_s3_key: string | null;
      created_at: Date;
      completed_at: Date | null;
    }>(
      `SELECT
        id,
        user_id,
        style,
        stage,
        nft_item_id,
        nft_collection_id,
        nft_metadata_cid,
        nft_image_cid,
        nft_model_cid,
        nft_tx_hash,
        nft_block_hash,
        nft_minted_at,
        nft_owner_address,
        image_s3_key,
        glb_s3_key,
        created_at,
        completed_at
      FROM monster_generations
      WHERE id = $1
        AND status = 'completed'`,
      [jobId]
    );

    if (rows.length === 0) {
      notFound();
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
      console.error('[Public Monster Page] Failed to generate presigned URLs:', s3Error);
    }

    // Fetch user_monster and evolution history for this user
    const { rows: userMonsterRows } = await query<{
      id: string;
      current_stage: EvolutionStage;
      nft_item_id: number | null;
      nft_owner_address: string | null;
    }>(
      `SELECT id, current_stage, nft_item_id, nft_owner_address
       FROM user_monsters WHERE user_id = $1 LIMIT 1`,
      [row.user_id]
    );

    if (userMonsterRows.length > 0) {
      const userMonster = userMonsterRows[0];

      // Fetch evolution history
      const { rows: historyRows } = await query<{
        id: string;
        stage: EvolutionStage;
        milestone_label: string | null;
        evolved_at: Date;
        assets_added: { image_cid?: string; model_cid?: string } | null;
        tx_hash: string | null;
      }>(
        `SELECT id, stage, milestone_label, evolved_at, assets_added, tx_hash
         FROM monster_evolution_history
         WHERE monster_id = $1
         ORDER BY evolved_at ASC`,
        [userMonster.id]
      );

      const evolutionHistory: EvolutionHistoryEntry[] = historyRows.map(h => ({
        id: h.id,
        stage: h.stage,
        milestone: h.milestone_label,
        timestamp: h.evolved_at.toISOString(),
        assets: h.assets_added,
        txHash: h.tx_hash
      }));

      const currentStage = userMonster.current_stage;
      const nextStage = STAGE_TRANSITIONS[currentStage];

      evolutionData = {
        currentStage,
        evolutionHistory,
        nextEvolution: nextStage ? {
          stage: nextStage,
          requiresGeneration: nextStage === 'adult',
          canEvolve: false // Public viewers can't evolve
        } : null,
        monsterId: userMonster.id,
        nftItemId: userMonster.nft_item_id || undefined,
        nftOwnerAddress: userMonster.nft_owner_address || undefined
      };
    }

    // Build monster data - only include NFT data if minted
    monster = {
      id: row.id,
      style: row.style,
      stage: row.stage,
      prompt: '', // Don't expose prompt publicly
      metadataCid: row.nft_metadata_cid,
      imageCid: row.nft_image_cid,
      modelCid: row.nft_model_cid,
      imageUrl: freshImageUrl,
      modelUrl: freshModelUrl,
      nft: row.nft_minted_at
        ? {
            itemId: row.nft_item_id!,
            collectionId: row.nft_collection_id!,
            ownerAddress: row.nft_owner_address!,
            txHash: row.nft_tx_hash || '',
            blockHash: row.nft_block_hash || '',
            mintedAt: row.nft_minted_at.toISOString(),
          }
        : null,
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at?.toISOString() || row.created_at.toISOString(),
    };
  } catch (error) {
    console.error('[Public Monster Page] Failed to fetch monster:', error);
    notFound();
  }

  return <MonsterViewerPage monster={monster} isPublic={true} evolutionData={evolutionData} />;
}
