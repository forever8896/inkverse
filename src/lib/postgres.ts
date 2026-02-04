import { Pool, PoolClient } from 'pg';

// Global connection pool instance
let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is required');
    }

    pool = new Pool({
      connectionString,
      // Connection pool configuration
      max: process.env.VERCEL === '1' ? 3 : 10, // Reduced for serverless
      min: process.env.VERCEL === '1' ? 0 : 2,  // Allow full drain
      idleTimeoutMillis: process.env.VERCEL === '1' ? 10000 : 30000, // Faster cleanup
      connectionTimeoutMillis: 5000, // Slightly longer for cold starts
      allowExitOnIdle: process.env.VERCEL === '1', // Allow process to exit
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true, ca: process.env.DB_CA_CERT || undefined } : false,
    });

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    // Log successful connection
    pool.on('connect', (client: any) => {
      // Set statement timeout to prevent long-running queries
      client.query('SET statement_timeout = 30000'); // 30 seconds
      console.log('New PostgreSQL client connected');
    });

    // Handle process termination
    if (typeof process !== 'undefined') {
      process.on('SIGTERM', async () => {
        console.log('SIGTERM received, closing pool...');
        await closePool();
        process.exit(0);
      });
    }

    console.log('PostgreSQL connection pool created');
  }

  return pool;
}

/**
 * Check pool health status
 */
export async function checkPoolHealth(): Promise<{ healthy: boolean; status: string; details: any }> {
  const status = getPoolStatus();
  
  if (status.status === 'not_initialized') {
    return { healthy: false, status: 'not_initialized', details: status };
  }

  const isHealthy = status.waitingCount === 0; // Simple health check: no one waiting
  
  return {
    healthy: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    details: status
  };
}

/**
 * Execute a query with automatic connection handling
 */
export async function query<T = any>(
  text: string, 
  params?: any[]
): Promise<{ rows: T[]; rowCount: number }> {
  const pool = getPool();
  
  try {
    const result = await pool.query(text, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    console.error('PostgreSQL query error:', {
      query: text,
      paramCount: params?.length ?? 0,
      error: error instanceof Error ? error.message : error
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('PostgreSQL connection successful:', result.rows[0]?.current_time);
    return true;
  } catch (error) {
    console.error('PostgreSQL connection failed:', error);
    return false;
  }
}

/**
 * Close the connection pool (useful for testing cleanup)
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
}

/**
 * Get pool status information
 */
export function getPoolStatus() {
  if (!pool) {
    return { status: 'not_initialized' };
  }

  return {
    status: 'initialized',
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
}

// Export the pool instance for direct access if needed
export { pool };