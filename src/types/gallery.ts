/**
 * Gallery-specific types for the Monster Gallery feature
 */

export interface GalleryMonster {
  id: string; // monster_generations.id (for public URL)
  imageUrl: string | null; // Presigned S3 URL for 2D image
  modelUrl: string | null; // Presigned S3 URL for 3D model (null if stage='young')
  stage: 'young' | 'young_3d' | 'adult';
  ownerAddress: string | null; // Wallet address (truncated in UI)
  createdAt: string; // ISO timestamp
}

export interface GalleryResponse {
  monsters: GalleryMonster[];
  total: number;
  hasMore: boolean;
}

export type GalleryCardSize = 'large' | 'small';
export type GalleryDirection = 'left' | 'right';
export type GallerySpeed = 'slow' | 'fast';
