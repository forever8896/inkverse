import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import { requireAdminApi } from '@/lib/admin-auth';

// PATCH /api/admin/api-costs/[costId]/end - End a cost period
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ costId: string }> }
) {
  // Require admin authentication
  const authResult = await requireAdminApi(request);
  if (authResult.error) return authResult.response;

  try {
    const { costId } = await params;

    // Validate cost ID
    if (!costId) {
      return NextResponse.json(
        { error: 'Cost ID is required' },
        { status: 400 }
      );
    }

    // Update the cost to end it now
    const result = await query(
      `UPDATE api_costs
      SET valid_to = NOW(), updated_at = NOW()
      WHERE id = $1 AND valid_to IS NULL
      RETURNING *`,
      [costId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'Cost configuration not found or already ended' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      cost: result.rows[0],
    });
  } catch (error) {
    console.error('Error ending API cost period:', error);
    return NextResponse.json(
      { error: 'Failed to end API cost period' },
      { status: 500 }
    );
  }
}