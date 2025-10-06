import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';

// GET /api/admin/api-costs - Fetch all API costs
export async function GET(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {

    // Fetch all costs, ordered by provider, service, and valid_from
    const result = await query(
      `SELECT
        id,
        provider,
        service,
        cost_per_unit,
        unit_type,
        valid_from,
        valid_to,
        notes,
        created_by,
        created_at
      FROM api_costs
      ORDER BY provider, service, valid_from DESC`,
      []
    );

    // Convert cost_per_unit from string to number (PostgreSQL DECIMAL comes as string)
    const costs = result.rows.map(row => ({
      ...row,
      cost_per_unit: parseFloat(row.cost_per_unit),
    }));

    return NextResponse.json({
      success: true,
      costs,
    });
  } catch (error) {
    console.error('Error fetching API costs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch API costs' },
      { status: 500 }
    );
  }
}

// POST /api/admin/api-costs - Create new cost configuration
export async function POST(request: NextRequest) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {

    // Parse request body
    const body = await request.json();
    const {
      provider,
      service,
      cost_per_unit,
      unit_type,
      valid_from,
      notes,
    } = body;

    // Validate required fields
    if (!provider || !service || cost_per_unit === undefined || !unit_type || !valid_from) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate cost is positive
    if (cost_per_unit <= 0) {
      return NextResponse.json(
        { error: 'Cost must be positive' },
        { status: 400 }
      );
    }

    // Begin transaction
    await query('BEGIN', []);

    try {
      // End any current active cost for this provider/service
      await query(
        `UPDATE api_costs
        SET valid_to = $1, updated_at = NOW()
        WHERE provider = $2
          AND service = $3
          AND valid_to IS NULL
          AND valid_from < $1`,
        [valid_from, provider, service]
      );

      // Insert new cost configuration
      const result = await query(
        `INSERT INTO api_costs (
          provider,
          service,
          cost_per_unit,
          unit_type,
          valid_from,
          notes,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          provider,
          service,
          cost_per_unit,
          unit_type,
          valid_from,
          notes || null,
          authResult.user.id,
        ]
      );

      // Commit transaction
      await query('COMMIT', []);

      // Convert cost_per_unit from string to number
      const cost = {
        ...result.rows[0],
        cost_per_unit: parseFloat(result.rows[0].cost_per_unit),
      };

      return NextResponse.json({
        success: true,
        cost,
      });
    } catch (error) {
      // Rollback transaction on error
      await query('ROLLBACK', []);
      throw error;
    }
  } catch (error) {
    console.error('Error creating API cost:', error);
    return NextResponse.json(
      { error: 'Failed to create API cost configuration' },
      { status: 500 }
    );
  }
}