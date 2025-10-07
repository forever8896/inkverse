import { Pool } from 'pg';

// Create a shared connection pool for database operations
// In Vercel serverless, this pool is recreated on each function invocation
export const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring a connection
});

// Helper to ensure connection is released
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const client = await db.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}
