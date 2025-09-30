#!/usr/bin/env node

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runSqlSchema() {
  if (!process.env.POSTGRES_URL) {
    console.error('❌ POSTGRES_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Creating Better Auth database tables...');

  // Create PostgreSQL pool
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: false, // Local development
  });

  try {
    // Read the SQL schema file
    const schemaPath = join(__dirname, 'better-auth-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('📄 Running SQL schema...');
    
    // Execute the schema
    await pool.query(schema);
    
    console.log('✅ Better Auth database tables created successfully!');
    
    // Verify tables were created
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
      ORDER BY table_name
    `);
    
    console.log('\n📁 Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });
    
    // Get detailed table info
    const tableInfo = await pool.query(`
      SELECT 
        table_name,
        COUNT(*) as column_count
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'account', 'session', 'verification')
      GROUP BY table_name
      ORDER BY table_name
    `);
    
    console.log('\n📊 Table Details:');
    tableInfo.rows.forEach(row => {
      console.log(`  - ${row.table_name}: ${row.column_count} columns`);
    });

    // Test user table specifically
    const userColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'user'
      ORDER BY ordinal_position
    `);

    console.log('\n👤 User table columns:');
    userColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n🎉 Better Auth is ready to use!');

  } catch (error) {
    console.error('❌ Error creating Better Auth tables:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the schema
runSqlSchema();