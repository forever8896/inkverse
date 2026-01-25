/**
 * EvolutionHistory - Database persistence layer for monster evolution history
 * Tracks all evolutions with assets and blockchain transactions
 *
 * This serves as an audit log of the NFT's evolution journey,
 * storing each milestone with its associated assets and metadata.
 */

import { getPool } from './postgres';
import { v4 as uuidv4 } from 'uuid';
import { EvolutionStage } from './user-monster';

export interface AssetsAdded {
  image_cid?: string;
  model_cid?: string;
}

export interface EvolutionHistoryEntry {
  stage: EvolutionStage;
  milestone: string;
  timestamp: string; // ISO 8601
  assets: AssetsAdded;
  txHash?: string;
  blockNumber?: number;
}

export interface EvolutionHistoryData {
  id: string;
  monsterId: string;
  stage: EvolutionStage;
  milestoneLabel?: string;
  assetsAdded?: AssetsAdded;
  metadataCid?: string;
  txHash?: string;
  blockHash?: string;
  blockNumber?: number;
  generationJobId?: string;
  lessonId?: number;
  chapterId?: number;
  stepId?: number;
  evolvedAt: Date;
}

export interface CreateEvolutionParams {
  monsterId: string;
  stage: EvolutionStage;
  milestoneLabel?: string;
  assetsAdded?: AssetsAdded;
  metadataCid?: string;
  txHash?: string;
  blockHash?: string;
  blockNumber?: number;
  generationJobId?: string;
  lessonId?: number;
  chapterId?: number;
  stepId?: number;
}

export class EvolutionHistory {
  private data: EvolutionHistoryData;

  constructor(data: EvolutionHistoryData) {
    this.data = data;
  }

  // Getters
  get id(): string { return this.data.id; }
  get monsterId(): string { return this.data.monsterId; }
  get stage(): EvolutionStage { return this.data.stage; }
  get milestoneLabel(): string | undefined { return this.data.milestoneLabel; }
  get assetsAdded(): AssetsAdded | undefined { return this.data.assetsAdded; }
  get metadataCid(): string | undefined { return this.data.metadataCid; }
  get txHash(): string | undefined { return this.data.txHash; }
  get blockHash(): string | undefined { return this.data.blockHash; }
  get blockNumber(): number | undefined { return this.data.blockNumber; }
  get generationJobId(): string | undefined { return this.data.generationJobId; }
  get lessonId(): number | undefined { return this.data.lessonId; }
  get chapterId(): number | undefined { return this.data.chapterId; }
  get stepId(): number | undefined { return this.data.stepId; }
  get evolvedAt(): Date { return this.data.evolvedAt; }

  /**
   * Map database row to EvolutionHistoryData
   */
  private static mapRowToData(row: any): EvolutionHistoryData {
    return {
      id: row.id,
      monsterId: row.monster_id,
      stage: row.stage as EvolutionStage,
      milestoneLabel: row.milestone_label ?? undefined,
      assetsAdded: row.assets_added ? (typeof row.assets_added === 'string' ? JSON.parse(row.assets_added) : row.assets_added) : undefined,
      metadataCid: row.metadata_cid ?? undefined,
      txHash: row.tx_hash ?? undefined,
      blockHash: row.block_hash ?? undefined,
      blockNumber: row.block_number ?? undefined,
      generationJobId: row.generation_job_id ?? undefined,
      lessonId: row.lesson_id ?? undefined,
      chapterId: row.chapter_id ?? undefined,
      stepId: row.step_id ?? undefined,
      evolvedAt: row.evolved_at
    };
  }

  /**
   * Record a new evolution
   */
  static async create(params: CreateEvolutionParams): Promise<EvolutionHistory> {
    const pool = getPool();
    const historyId = uuidv4();

    try {
      const result = await pool.query(`
        INSERT INTO monster_evolution_history (
          id,
          monster_id,
          stage,
          milestone_label,
          assets_added,
          metadata_cid,
          tx_hash,
          block_hash,
          block_number,
          generation_job_id,
          lesson_id,
          chapter_id,
          step_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `, [
        historyId,
        params.monsterId,
        params.stage,
        params.milestoneLabel || null,
        params.assetsAdded ? JSON.stringify(params.assetsAdded) : null,
        params.metadataCid || null,
        params.txHash || null,
        params.blockHash || null,
        params.blockNumber || null,
        params.generationJobId || null,
        params.lessonId || null,
        params.chapterId || null,
        params.stepId || null
      ]);

      const row = result.rows[0];
      console.log(`[EvolutionHistory] Recorded evolution ${historyId} for monster ${params.monsterId} to stage ${params.stage}`);

      return new EvolutionHistory(EvolutionHistory.mapRowToData(row));

    } catch (error) {
      console.error('[EvolutionHistory] Failed to record evolution:', error);
      throw error;
    }
  }

  /**
   * Find evolution history by ID
   */
  static async findById(historyId: string): Promise<EvolutionHistory | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_evolution_history WHERE id = $1
      `, [historyId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new EvolutionHistory(EvolutionHistory.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to find history ${historyId}:`, error);
      throw error;
    }
  }

  /**
   * Get full evolution history for a monster
   */
  static async findByMonsterId(monsterId: string): Promise<EvolutionHistory[]> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_evolution_history
        WHERE monster_id = $1
        ORDER BY evolved_at ASC
      `, [monsterId]);

      return result.rows.map((row: any) => new EvolutionHistory(EvolutionHistory.mapRowToData(row)));

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to find history for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Get the latest evolution for a monster
   */
  static async findLatestByMonsterId(monsterId: string): Promise<EvolutionHistory | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_evolution_history
        WHERE monster_id = $1
        ORDER BY evolved_at DESC
        LIMIT 1
      `, [monsterId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new EvolutionHistory(EvolutionHistory.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to find latest evolution for monster ${monsterId}:`, error);
      throw error;
    }
  }

  /**
   * Find evolution by monster and stage
   */
  static async findByMonsterAndStage(monsterId: string, stage: EvolutionStage): Promise<EvolutionHistory | null> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_evolution_history
        WHERE monster_id = $1 AND stage = $2
        ORDER BY evolved_at DESC
        LIMIT 1
      `, [monsterId, stage]);

      if (result.rows.length === 0) {
        return null;
      }

      return new EvolutionHistory(EvolutionHistory.mapRowToData(result.rows[0]));

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to find evolution for monster ${monsterId} stage ${stage}:`, error);
      throw error;
    }
  }

  /**
   * Update evolution with transaction details
   */
  async setTransactionDetails(params: {
    txHash: string;
    blockHash?: string;
    blockNumber?: number;
  }): Promise<void> {
    const pool = getPool();

    try {
      await pool.query(`
        UPDATE monster_evolution_history
        SET tx_hash = $1, block_hash = $2, block_number = $3
        WHERE id = $4
      `, [params.txHash, params.blockHash || null, params.blockNumber || null, this.data.id]);

      this.data.txHash = params.txHash;
      this.data.blockHash = params.blockHash;
      this.data.blockNumber = params.blockNumber;

      console.log(`[EvolutionHistory] Updated transaction details for ${this.data.id}`);

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to update transaction details:`, error);
      throw error;
    }
  }

  /**
   * Update metadata CID after IPFS upload
   */
  async setMetadataCid(cid: string): Promise<void> {
    const pool = getPool();

    try {
      await pool.query(`
        UPDATE monster_evolution_history
        SET metadata_cid = $1
        WHERE id = $2
      `, [cid, this.data.id]);

      this.data.metadataCid = cid;

      console.log(`[EvolutionHistory] Updated metadata CID for ${this.data.id}`);

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to update metadata CID:`, error);
      throw error;
    }
  }

  /**
   * Convert to timeline entry format for API responses
   */
  toTimelineEntry(): EvolutionHistoryEntry {
    return {
      stage: this.data.stage,
      milestone: this.data.milestoneLabel || this.getDefaultMilestoneLabel(),
      timestamp: this.data.evolvedAt.toISOString(),
      assets: this.data.assetsAdded || {},
      txHash: this.data.txHash,
      blockNumber: this.data.blockNumber
    };
  }

  /**
   * Get default milestone label based on stage
   */
  private getDefaultMilestoneLabel(): string {
    switch (this.data.stage) {
      case 'young':
        return 'Monster Created';
      case 'young_3d':
        return '3D Model Unlocked';
      case 'adult':
        return 'Adult Form Achieved';
      default:
        return 'Evolution';
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): EvolutionHistoryData {
    return { ...this.data };
  }

  /**
   * Get formatted evolution history for NFT metadata
   */
  static async getMetadataHistory(monsterId: string): Promise<EvolutionHistoryEntry[]> {
    const history = await EvolutionHistory.findByMonsterId(monsterId);
    return history.map(entry => entry.toTimelineEntry());
  }

  /**
   * Count evolutions for a monster
   */
  static async countByMonsterId(monsterId: string): Promise<number> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT COUNT(*)::int as count FROM monster_evolution_history
        WHERE monster_id = $1
      `, [monsterId]);

      return result.rows[0]?.count || 0;

    } catch (error) {
      console.error(`[EvolutionHistory] Failed to count evolutions for monster ${monsterId}:`, error);
      return 0;
    }
  }

  /**
   * Get all evolutions (admin function)
   */
  static async findRecent(limit: number = 50): Promise<EvolutionHistory[]> {
    const pool = getPool();

    try {
      const result = await pool.query(`
        SELECT * FROM monster_evolution_history
        ORDER BY evolved_at DESC
        LIMIT $1
      `, [limit]);

      return result.rows.map((row: any) => new EvolutionHistory(EvolutionHistory.mapRowToData(row)));

    } catch (error) {
      console.error('[EvolutionHistory] Failed to find recent evolutions:', error);
      throw error;
    }
  }
}
