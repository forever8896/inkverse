import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth-server';
import { query } from '@/lib/postgres';
import { MonsterViewerPage } from '@/components/nft-viewer';
import type { MonsterData, EvolutionData, EvolutionHistoryEntry } from '@/app/api/my-monster/route';
import type { MonsterStage, MonsterStyle } from '@/lib/ipfs-utils';
import type { EvolutionStage } from '@/lib/user-monster';

export const metadata = {
  title: 'My Monster | Monsters Ink!',
  description: 'View your personal monster NFT in an immersive experience',
};

// Stage transitions for determining next evolution
const STAGE_TRANSITIONS: Record<EvolutionStage, EvolutionStage | null> = {
  'young': 'young_3d',
  'young_3d': 'adult',
  'adult': null
};

/**
 * Server Component for the personal NFT viewer.
 * Handles authentication and fetches initial monster data server-side.
 */
export default async function MyMonsterPage() {
  // Get session server-side
  const session = await getServerSession();

  // Redirect unauthenticated users to lab
  if (!session) {
    redirect('/lab');
  }

  const userId = session.user.id;

  // Fetch monster data server-side
  let monster: MonsterData | null = null;
  let evolutionData: EvolutionData | undefined = undefined;

  try {
    // First check user_monsters table for evolution tracking
    const { rows: monsterRows } = await query<{
      id: string;
      current_stage: EvolutionStage;
      nft_item_id: number | null;
      nft_collection_id: number;
      nft_owner_address: string | null;
      current_metadata_cid: string | null;
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

    // Get the latest completed generation job
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
      image_url: string | null;
      glb_url: string | null;
      created_at: Date;
      completed_at: Date;
    }>(
      `SELECT * FROM monster_generations
       WHERE user_id = $1 AND status = 'completed' AND nft_minted_at IS NOT NULL
       ORDER BY nft_minted_at DESC LIMIT 1`,
      [userId]
    );

    if (genRows.length > 0) {
      const genRow = genRows[0];
      const userMonster = monsterRows[0];
      const currentStage: EvolutionStage = userMonster?.current_stage || 'young';

      // Determine if 3D model should be shown
      const shouldShowModel = currentStage === 'young_3d' || currentStage === 'adult';

      // Build evolution data if we have user_monster record
      if (userMonster) {
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

        const evolutionHistory: EvolutionHistoryEntry[] = historyRows.map(h => ({
          id: h.id,
          stage: h.stage,
          milestone: h.milestone_label,
          timestamp: h.evolved_at.toISOString(),
          assets: h.assets_added,
          txHash: h.tx_hash
        }));

        const nextStage = STAGE_TRANSITIONS[currentStage];

        evolutionData = {
          currentStage,
          evolutionHistory,
          nextEvolution: nextStage ? {
            stage: nextStage,
            requiresGeneration: nextStage === 'adult',
            canEvolve: true
          } : null,
          monsterId: userMonster.id,
          nftItemId: userMonster.nft_item_id || undefined,
          nftOwnerAddress: userMonster.nft_owner_address || undefined
        };
      }

      monster = {
        id: genRow.id,
        style: genRow.style,
        stage: genRow.stage,
        prompt: genRow.prompt,
        metadataCid: userMonster?.current_metadata_cid || genRow.nft_metadata_cid,
        imageCid: userMonster?.young_image_cid || genRow.nft_image_cid,
        // Only include model CID/URL if evolution stage allows
        modelCid: shouldShowModel ? (userMonster?.young_model_cid || genRow.nft_model_cid) : null,
        imageUrl: genRow.image_url,
        modelUrl: shouldShowModel ? genRow.glb_url : null,
        nft: {
          itemId: userMonster?.nft_item_id || genRow.nft_item_id,
          collectionId: userMonster?.nft_collection_id || genRow.nft_collection_id,
          ownerAddress: userMonster?.nft_owner_address || genRow.nft_owner_address,
          txHash: genRow.nft_tx_hash,
          blockHash: genRow.nft_block_hash,
          mintedAt: genRow.nft_minted_at.toISOString(),
        },
        createdAt: genRow.created_at.toISOString(),
        completedAt: genRow.completed_at.toISOString(),
        evolution: evolutionData
      };
    }
  } catch (error) {
    console.error('[My Monster Page] Failed to fetch monster:', error);
    // Continue with null monster - component will show empty state
  }

  return <MonsterViewerPage monster={monster} isPublic={false} evolutionData={evolutionData} />;
}
