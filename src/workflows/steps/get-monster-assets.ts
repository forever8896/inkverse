"use step"

/**
 * Get Monster Assets Step
 * Retrieves the monster's existing assets from the database
 * Used during evolution to get the 2D image for adult 3D generation
 */

import { UserMonster } from '@/lib/user-monster';

/**
 * Get the monster's 2D image S3 key for use in 3D conversion
 */
export async function getMonsterImageKey(monsterId: string): Promise<string> {
  console.log(`[Step:GetMonsterAssets] Fetching monster ${monsterId}`);

  const monster = await UserMonster.findById(monsterId);

  if (!monster) {
    throw new Error(`Monster ${monsterId} not found`);
  }

  const imageS3Key = monster.youngImageS3Key;

  if (!imageS3Key) {
    throw new Error(`Monster ${monsterId} has no 2D image`);
  }

  console.log(`[Step:GetMonsterAssets] Found image S3 key: ${imageS3Key}`);

  return imageS3Key;
}

/**
 * Get monster's current model S3 key (young stage)
 */
export async function getMonsterModelKey(monsterId: string): Promise<string | null> {
  console.log(`[Step:GetMonsterAssets] Fetching monster model ${monsterId}`);

  const monster = await UserMonster.findById(monsterId);

  if (!monster) {
    throw new Error(`Monster ${monsterId} not found`);
  }

  return monster.youngModelS3Key || null;
}

/**
 * Get monster's NFT details
 */
export async function getMonsterNFTDetails(monsterId: string): Promise<{
  nftItemId: number | undefined;
  nftCollectionId: number;
  nftOwnerAddress: string | undefined;
  currentMetadataCid: string | undefined;
}> {
  console.log(`[Step:GetMonsterAssets] Fetching NFT details for ${monsterId}`);

  const monster = await UserMonster.findById(monsterId);

  if (!monster) {
    throw new Error(`Monster ${monsterId} not found`);
  }

  if (!monster.nftItemId) {
    throw new Error(`Monster ${monsterId} has not been minted`);
  }

  return {
    nftItemId: monster.nftItemId,
    nftCollectionId: monster.nftCollectionId,
    nftOwnerAddress: monster.nftOwnerAddress,
    currentMetadataCid: monster.currentMetadataCid
  };
}
