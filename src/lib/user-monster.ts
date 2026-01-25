/**
 * UserMonster - Database persistence layer for user monsters
 * Handles the single evolving monster NFT per user
 *
 * This is the core model for the NFT Evolution System, tracking:
 * - Current evolution stage (young, young_3d, adult)
 * - Asset references (S3 keys and IPFS CIDs)
 * - NFT identifiers (collection, item ID, owner)
 * - Evolution history linkage
 */

import { getPool, transaction } from './postgres';
import { v4 as uuidv4 } from 'uuid';

// Evolution stages for monster progression
export type EvolutionStage = 'young' | 'young_3d' | 'adult';

// Valid stage transitions
export const STAGE_TRANSITIONS: Record<EvolutionStage, EvolutionStage[]> = {
  'young': ['young_3d'],
  'young_3d': ['adult'],
  'adult': []  // Terminal stage
};

// Stage display names
export const STAGE_DISPLAY_NAMES: Record<EvolutionStage, string> = {
  'young': 'Young (2D)',
  'young_3d': 'Young (3D)',
  'adult': 'Adult'
};

// Stage progress values (for progress bar)
export const STAGE_PROGRESS: Record<EvolutionStage, number> = {
  'young': 1,
  'young_3d': 2,
  'adult': 3
};

export interface MonsterAttributes {
  style?: string;
  bodyType?: string;
  specialPower?: string;
  primaryColor?: string;
  secondaryColor?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface UserMonsterData {
  id: string;
  userId: string;
  currentStage: EvolutionStage;

  // NFT identifiers
  nftItemId?: number;
  nftCollectionId: number;
  nftOwnerAddress?: string;
  currentMetadataCid?: string;

  // Asset S3 keys
  youngImageS3Key?: string;
  youngModelS3Key?: string;
  adultModelS3Key?: string;

  // IPFS CIDs
  youngImageCid?: string;
  youngModelCid?: string;
  adultModelCid?: string;

  // Generation data
  generationPrompt?: string;
  generationStyle?: string;
  attributes: MonsterAttributes;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMonsterParams {
  userId: string;
  nftOwnerAddress?: string;
  generationPrompt?: string;
  generationStyle?: string;
  attributes?: MonsterAttributes;
}

export interface UpdateMonsterParams {
  currentStage?: EvolutionStage;
  nftItemId?: number;
  nftCollectionId?: number;
  nftOwnerAddress?: string;
  currentMetadataCid?: string;
  youngImageS3Key?: string;
  youngModelS3Key?: string;
  adultModelS3Key?: string;
  youngImageCid?: string;
  youngModelCid?: string;
  adultModelCid?: string;
  generationPrompt?: string;
  generationStyle?: string;
  attributes?: MonsterAttributes;
}

export class UserMonster {
  private data: UserMonsterData;

  constructor(data: UserMonsterData) {
    this.data = data;
  }

  // Getters
  get id(): string { return this.data.id; }
  get userId(): string { return this.data.userId; }
  get currentStage(): EvolutionStage { return this.data.currentStage; }
  get nftItemId(): number | undefined { return this.data.nftItemId; }
  get nftCollectionId(): number { return this.data.nftCollectionId; }
  get nftOwnerAddress(): string | undefined { return this.data.nftOwnerAddress; }
  get currentMetadataCid(): string | undefined { return this.data.currentMetadataCid; }
  get youngImageS3Key(): string | undefined { return this.data.youngImageS3Key; }
  get youngModelS3Key(): string | undefined { return this.data.youngModelS3Key; }
  get adultModelS3Key(): string | undefined { return this.data.adultModelS3Key; }
  get youngImageCid(): string | undefined { return this.data.youngImageCid; }
  get youngModelCid(): string | undefined { return this.data.youngModelCid; }
  get adultModelCid(): string | undefined { return this.data.adultModelCid; }
  get generationPrompt(): string | undefined { return this.data.generationPrompt; }
  get generationStyle(): string | undefined { return this.data.generationStyle; }
  get attributes(): MonsterAttributes { return this.data.attributes; }
  get createdAt(): Date { return this.data.createdAt; }
  get updatedAt(): Date { return this.data.updatedAt; }

  /**
   * Check if monster can evolve to a target stage
   */
  canEvolveTo(targetStage: EvolutionStage): boolean {
    const validTransitions = STAGE_TRANSITIONS[this.data.currentStage];
    return validTransitions.includes(targetStage);
  }

  /**
   * Get the next available evolution stage
   */
  getNextEvolutionStage(): EvolutionStage | null {
    const validTransitions = STAGE_TRANSITIONS[this.data.currentStage];
    return validTransitions.length > 0 ? validTransitions[0] : null;
  }

  /**
   * Check if monster has been minted on-chain
   */
  isMinted(): boolean {
    return this.data.nftItemId !== undefined && this.data.nftItemId !== null;
  }

  /**
   * Get current image URL (S3 key for current stage)
   */
  getCurrentImageS3Key(): string | undefined {
    // All stages use the young image as the 2D representation
    return this.data.youngImageS3Key;
  }

  /**
   * Get current model URL (S3 key based on stage)
   */
  getCurrentModelS3Key(): string | undefined {
    switch (this.data.currentStage) {
      case 'young':
        return undefined; // No model revealed yet
      case 'young_3d':
        return this.data.youngModelS3Key;
      case 'adult':
        return this.data.adultModelS3Key;
      default:
        return undefined;
    }
  }

  /**
   * Get evolution progress (1-3)
   */
  getEvolutionProgress(): number {
    return STAGE_PROGRESS[this.data.currentStage];
  }

  /**
   * Get display name for current stage
   */
  getStageDisplayName(): string {
    return STAGE_DISPLAY_NAMES[this.data.currentStage];
  }

  /**
   * Map database row to UserMonsterData
   */
  private static mapRowToData(row: any): UserMonsterData {
    return {
      id: row.id,
      userId: row.user_id,
      currentStage: row.current_stage as EvolutionStage,
      nftItemId: row.nft_item_id ?? undefined,
      nftCollectionId: row.nft_collection_id ?? 11,
      nftOwnerAddress: row.nft_owner_address ?? undefined,
      currentMetadataCid: row.current_metadata_cid ?? undefined,
      youngImageS3Key: row.young_image_s3_key ?? undefined,
      youngModelS3Key: row.young_model_s3_key ?? undefined,
      adultModelS3Key: row.adult_model_s3_key ?? undefined,
      youngImageCid: row.young_image_cid ?? undefined,
      youngModelCid: row.young_model_cid ?? undefined,
      adultModelCid: row.adult_model_cid ?? undefined,
      generationPrompt: row.generation_prompt ?? undefined,
      generationStyle: row.generation_style ?? undefined,
      attributes: row.attributes ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  /**
   * Create a new monster for a user
   */
  static async create(params: CreateMonsterParams): Promise<UserMonster> {
    const pool = getPool();
    const monsterId = uuidv4();

    try {
      const result = await pool.query(`
        INSERT INTO user_monsters (
          id,
          user_id,
          current_stage,
          nft_owner_address,
          generation_prompt,
          generation_style,
          attributes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        monsterId,
        params.userId,
        'young', // Always start at young stage
        params.nftOwnerAddress || null,
        params.generationPrompt || null,
        params.generationStyle || null,
        JSON.stringify(params.attributes || {})
      ]);

      const row = result.rows[0];
      console.log(`[UserMonster] Created monster ${monsterId} for user ${params.userId}`);

      return new UserMonster(UserMonster.mapRowToData(row));

    } catch (error) {
      // Check for unique constraint violation (user already has a monster)
      if ((error as any).code === '23505') {
        console.log(`[UserMonster] User ${params.userId} already has a monster`);
        const existingMonster = await UserMonster.findByUserId(params.userId);
        if (existingMonster) {
          return existingMonster;
        }
      }
      console.error('[UserMonster] Failed to create monster:', error);
      throw error;
    }
  }

  /**
   * Create or get existing monster for a user (idempotent)
   */
  static async getOrCreate(params: CreateMonsterParams): Promise<UserMonster> {
    // First try to find existing
    const existing = await UserMonster.findByUserId(params.userId);
    if (existing) {
      return existing;
    }

    // Create new
    return UserMonster.create(params);
  }

  /**
   * Find a monster by its ID
   */
  static async findById(monsterId: string): Promise<UserMonster | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM user_monsters WHERE id = $1
      `, [monsterId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new UserMonster(UserMonster.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[UserMonster] Failed to find monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Find a user's monster
   */
  static async findByUserId(userId: string): Promise<UserMonster | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM user_monsters WHERE user_id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new UserMonster(UserMonster.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[UserMonster] Failed to find monster for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find a monster by NFT identifiers
   */
  static async findByNFT(collectionId: number, itemId: number): Promise<UserMonster | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM user_monsters
        WHERE nft_collection_id = $1 AND nft_item_id = $2
      `, [collectionId, itemId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new UserMonster(UserMonster.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[UserMonster] Failed to find monster by NFT ${collectionId}/${itemId}:`, error);
      throw error;
    }
  }

  /**
   * Update the monster
   */
  async update(params: UpdateMonsterParams): Promise<void> {
    const pool = getPool();

    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (params.currentStage !== undefined) {
        updates.push(`current_stage = $${paramIndex++}`);
        values.push(params.currentStage);
        this.data.currentStage = params.currentStage;
      }

      if (params.nftItemId !== undefined) {
        updates.push(`nft_item_id = $${paramIndex++}`);
        values.push(params.nftItemId);
        this.data.nftItemId = params.nftItemId;
      }

      if (params.nftCollectionId !== undefined) {
        updates.push(`nft_collection_id = $${paramIndex++}`);
        values.push(params.nftCollectionId);
        this.data.nftCollectionId = params.nftCollectionId;
      }

      if (params.nftOwnerAddress !== undefined) {
        updates.push(`nft_owner_address = $${paramIndex++}`);
        values.push(params.nftOwnerAddress);
        this.data.nftOwnerAddress = params.nftOwnerAddress;
      }

      if (params.currentMetadataCid !== undefined) {
        updates.push(`current_metadata_cid = $${paramIndex++}`);
        values.push(params.currentMetadataCid);
        this.data.currentMetadataCid = params.currentMetadataCid;
      }

      if (params.youngImageS3Key !== undefined) {
        updates.push(`young_image_s3_key = $${paramIndex++}`);
        values.push(params.youngImageS3Key);
        this.data.youngImageS3Key = params.youngImageS3Key;
      }

      if (params.youngModelS3Key !== undefined) {
        updates.push(`young_model_s3_key = $${paramIndex++}`);
        values.push(params.youngModelS3Key);
        this.data.youngModelS3Key = params.youngModelS3Key;
      }

      if (params.adultModelS3Key !== undefined) {
        updates.push(`adult_model_s3_key = $${paramIndex++}`);
        values.push(params.adultModelS3Key);
        this.data.adultModelS3Key = params.adultModelS3Key;
      }

      if (params.youngImageCid !== undefined) {
        updates.push(`young_image_cid = $${paramIndex++}`);
        values.push(params.youngImageCid);
        this.data.youngImageCid = params.youngImageCid;
      }

      if (params.youngModelCid !== undefined) {
        updates.push(`young_model_cid = $${paramIndex++}`);
        values.push(params.youngModelCid);
        this.data.youngModelCid = params.youngModelCid;
      }

      if (params.adultModelCid !== undefined) {
        updates.push(`adult_model_cid = $${paramIndex++}`);
        values.push(params.adultModelCid);
        this.data.adultModelCid = params.adultModelCid;
      }

      if (params.generationPrompt !== undefined) {
        updates.push(`generation_prompt = $${paramIndex++}`);
        values.push(params.generationPrompt);
        this.data.generationPrompt = params.generationPrompt;
      }

      if (params.generationStyle !== undefined) {
        updates.push(`generation_style = $${paramIndex++}`);
        values.push(params.generationStyle);
        this.data.generationStyle = params.generationStyle;
      }

      if (params.attributes !== undefined) {
        updates.push(`attributes = $${paramIndex++}`);
        values.push(JSON.stringify(params.attributes));
        this.data.attributes = params.attributes;
      }

      if (updates.length === 0) {
        return; // No updates
      }

      values.push(this.data.id);

      const query = `
        UPDATE user_monsters
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${paramIndex}
        RETURNING updated_at
      `;

      const result = await pool.query(query, values);
      this.data.updatedAt = result.rows[0].updated_at;

      console.log(`[UserMonster] Updated monster ${this.data.id}: ${updates.join(', ')}`);

    } catch (error) {
      console.error(`[UserMonster] Failed to update monster ${this.data.id}:`, error);
      throw error;
    }
  }

  /**
   * Evolve to a new stage (with validation)
   */
  async evolve(targetStage: EvolutionStage): Promise<void> {
    if (!this.canEvolveTo(targetStage)) {
      throw new Error(`Cannot evolve from ${this.data.currentStage} to ${targetStage}`);
    }

    await this.update({ currentStage: targetStage });
    console.log(`[UserMonster] Monster ${this.data.id} evolved to ${targetStage}`);
  }

  /**
   * Set NFT minting data after successful mint
   */
  async setMintData(params: {
    nftItemId: number;
    nftCollectionId?: number;
    nftOwnerAddress: string;
    metadataCid: string;
  }): Promise<void> {
    await this.update({
      nftItemId: params.nftItemId,
      nftCollectionId: params.nftCollectionId ?? 11,
      nftOwnerAddress: params.nftOwnerAddress,
      currentMetadataCid: params.metadataCid
    });
  }

  /**
   * Set asset S3 keys after generation
   */
  async setYoungAssets(params: {
    imageS3Key: string;
    modelS3Key?: string;
    imageCid?: string;
  }): Promise<void> {
    await this.update({
      youngImageS3Key: params.imageS3Key,
      youngModelS3Key: params.modelS3Key,
      youngImageCid: params.imageCid
    });
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): UserMonsterData & {
    displayName: string;
    evolutionProgress: number;
    maxEvolution: number;
    canEvolve: boolean;
    nextEvolution: EvolutionStage | null;
    isMinted: boolean;
    currentImageS3Key?: string;
    currentModelS3Key?: string;
  } {
    return {
      ...this.data,
      displayName: this.getStageDisplayName(),
      evolutionProgress: this.getEvolutionProgress(),
      maxEvolution: 3,
      canEvolve: this.getNextEvolutionStage() !== null,
      nextEvolution: this.getNextEvolutionStage(),
      isMinted: this.isMinted(),
      currentImageS3Key: this.getCurrentImageS3Key(),
      currentModelS3Key: this.getCurrentModelS3Key()
    };
  }

  /**
   * Get all monsters (admin function)
   */
  static async findAll(limit: number = 100, offset: number = 0): Promise<UserMonster[]> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM user_monsters
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);

      return result.rows.map((row: any) => new UserMonster(UserMonster.mapRowToData(row)));

    } catch (error) {
      console.error('[UserMonster] Failed to find all monsters:', error);
      throw error;
    }
  }

  /**
   * Count total monsters by stage
   */
  static async countByStage(): Promise<Record<EvolutionStage, number>> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT
          COALESCE(COUNT(*) FILTER (WHERE current_stage = 'young')::int, 0) as young,
          COALESCE(COUNT(*) FILTER (WHERE current_stage = 'young_3d')::int, 0) as young_3d,
          COALESCE(COUNT(*) FILTER (WHERE current_stage = 'adult')::int, 0) as adult
        FROM user_monsters
      `);

      const row = result.rows[0];
      return {
        young: row.young || 0,
        young_3d: row.young_3d || 0,
        adult: row.adult || 0
      };

    } catch (error) {
      console.error('[UserMonster] Failed to count by stage:', error);
      return { young: 0, young_3d: 0, adult: 0 };
    }
  }
}
