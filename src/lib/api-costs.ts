/**
 * API Cost Management Utility
 * Fetches current costs from database instead of using hardcoded values
 */

import { query } from '@/lib/postgres';

export interface ApiCost {
  provider: string;
  service: string;
  costPerUnit: number;
  unitType: string;
}

/**
 * Get the current cost for a specific API service
 * Uses temporal validity to get the cost that was active at a specific time
 */
export async function getApiCost(
  provider: string,
  service: string,
  atTime?: Date
): Promise<number | null> {
  const timeToCheck = atTime || new Date();

  try {
    const result = await query(
      `SELECT cost_per_unit
      FROM api_costs
      WHERE provider = $1
        AND service = $2
        AND valid_from <= $3
        AND (valid_to IS NULL OR valid_to > $3)
      ORDER BY valid_from DESC
      LIMIT 1`,
      [provider, service, timeToCheck.toISOString()]
    );

    if (result.rows.length > 0) {
      return parseFloat(result.rows[0].cost_per_unit);
    }

    // Return null if no cost found - caller should handle with fallback
    return null;
  } catch (error) {
    console.error(`Error fetching cost for ${provider}/${service}:`, error);
    return null;
  }
}

/**
 * Get all current costs for all services
 */
export async function getAllCurrentCosts(): Promise<ApiCost[]> {
  try {
    const result = await query(
      `SELECT DISTINCT ON (provider, service)
        provider,
        service,
        cost_per_unit,
        unit_type
      FROM api_costs
      WHERE valid_from <= NOW()
        AND (valid_to IS NULL OR valid_to > NOW())
      ORDER BY provider, service, valid_from DESC`,
      []
    );

    return result.rows.map(row => ({
      provider: row.provider,
      service: row.service,
      costPerUnit: parseFloat(row.cost_per_unit),
      unitType: row.unit_type,
    }));
  } catch (error) {
    console.error('Error fetching all current costs:', error);
    return [];
  }
}

/**
 * Calculate total cost for a generation based on temporal costs
 */
export async function calculateGenerationCost(
  generationTime: Date,
  includeOpenAI: boolean = true,
  includeFal: boolean = true
): Promise<{
  openaiCost: number;
  falCost: number;
  totalCost: number;
}> {
  let openaiCost = 0;
  let falCost = 0;

  if (includeOpenAI) {
    const cost = await getApiCost('openai', 'gpt-image-1', generationTime);
    openaiCost = cost ?? 0.040; // Fallback to default if not found
  }

  if (includeFal) {
    const cost = await getApiCost('fal', 'tripo3d-v2.5', generationTime);
    falCost = cost ?? 0.300; // Fallback to default if not found
  }

  return {
    openaiCost,
    falCost,
    totalCost: openaiCost + falCost,
  };
}

// Default costs for fallback (when database is not available)
export const DEFAULT_COSTS = {
  OPENAI_IMAGE: 0.040,
  FAL_CONVERSION: 0.300,
};