/**
 * Simple Health Check Endpoint
 *
 * Returns basic system health status for monitoring and load balancers.
 * No authentication required - needs to be accessible for operational monitoring.
 */

import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy';
    application: 'healthy';
  };
}

/**
 * GET /api/health
 * Simple health check that verifies basic connectivity
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  // Check database connectivity
  let databaseStatus: 'healthy' | 'unhealthy' = 'unhealthy';

  try {
    // Simple query to verify database is reachable
    await query('SELECT 1', []);
    databaseStatus = 'healthy';
  } catch (error) {
    console.error('Health check database error:', error);
    // Database is down, but we still return a response
  }

  // Determine overall status
  const overallStatus: 'healthy' | 'unhealthy' = databaseStatus === 'healthy' ? 'healthy' : 'unhealthy';

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    services: {
      database: databaseStatus,
      application: 'healthy', // If we're responding, the app is running
    },
  };

  // Return appropriate HTTP status code
  const httpStatus = overallStatus === 'healthy' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: httpStatus });
}