import { notFound } from 'next/navigation';
import { query } from '@/lib/postgres';
import { MonsterViewerPage } from '@/components/nft-viewer';
import type { MonsterData } from '@/app/api/my-monster/route';
import type { MonsterStage, MonsterStyle } from '@/lib/ipfs-utils';

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

  try {
    const { rows } = await query<{
      id: string;
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
      image_url: string | null;
      glb_url: string | null;
      created_at: Date;
      completed_at: Date | null;
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
        nft_tx_hash,
        nft_block_hash,
        nft_minted_at,
        nft_owner_address,
        image_url,
        glb_url,
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

    // Build monster data - only include NFT data if minted
    monster = {
      id: row.id,
      style: row.style,
      stage: row.stage,
      prompt: '', // Don't expose prompt publicly
      metadataCid: row.nft_metadata_cid,
      imageCid: row.nft_image_cid,
      modelCid: row.nft_model_cid,
      imageUrl: row.image_url,
      modelUrl: row.glb_url,
      nft: row.nft_minted_at
        ? {
            itemId: row.nft_item_id!,
            collectionId: row.nft_collection_id!,
            ownerAddress: row.nft_owner_address!,
            txHash: row.nft_tx_hash || '',
            blockHash: row.nft_block_hash || '',
            mintedAt: row.nft_minted_at.toISOString(),
          }
        : {
            itemId: 0,
            collectionId: 0,
            ownerAddress: '',
            txHash: '',
            blockHash: '',
            mintedAt: '',
          },
      createdAt: row.created_at.toISOString(),
      completedAt: row.completed_at?.toISOString() || row.created_at.toISOString(),
    };

    // If no NFT data, set nft to indicate not minted
    if (!row.nft_minted_at) {
      // @ts-ignore - Override to null for display logic
      monster.nft = null;
    }
  } catch (error) {
    console.error('[Public Monster Page] Failed to fetch monster:', error);
    notFound();
  }

  return <MonsterViewerPage monster={monster} isPublic={true} />;
}
