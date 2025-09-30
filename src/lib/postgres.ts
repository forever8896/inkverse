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
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
      // SSL configuration for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Handle pool errors
    pool.on('error', (err: Error) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });

    // Log successful connection
    pool.on('connect', (client: any) => {
      console.log('New PostgreSQL client connected');
    });

    console.log('PostgreSQL connection pool created');
  }

  return pool;
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
      params,
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