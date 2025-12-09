import { Pool } from 'pg';

// Create a shared connection pool for database operations
// In Vercel serverless, this pool is recreated on each function invocation
const isVercel = process.env.VERCEL === '1';

export const db = new Pool({
  connectionString: process.env.POSTGRES_URL,
  max: isVercel ? 3 : 10, // Reduced for serverless
  idleTimeoutMillis: isVercel ? 10000 : 30000, // Faster cleanup
  connectionTimeoutMillis: 10000, // Timeout for acquiring a connection
  allowExitOnIdle: isVercel,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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
