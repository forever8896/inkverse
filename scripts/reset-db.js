#!/usr/bin/env node

/**
 * Database reset script
 * WARNING: This will DROP ALL TABLES and re-run migrations
 * Only use in development!
 */

const { Pool } = require('pg');
const path = require('path');
const { execSync } = require('child_process');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function resetDatabase() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    console.log('⚠️  WARNING: This will DROP ALL TABLES!\n');
    console.log('Starting database reset in 3 seconds...\n');

    // Give user time to cancel
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('🗑️  Dropping all tables...\n');

    // Drop tables in reverse order of dependencies
    const dropStatements = [
      'DROP TABLE IF EXISTS monster_generations CASCADE;',
      'DROP TABLE IF EXISTS api_costs CASCADE;',
      'DROP TABLE IF EXISTS verification CASCADE;',
      'DROP TABLE IF EXISTS account CASCADE;',
      'DROP TABLE IF EXISTS session CASCADE;',
      'DROP TABLE IF EXISTS "user" CASCADE;',
      'DROP TYPE IF EXISTS generation_status CASCADE;',
      'DROP TYPE IF EXISTS monster_stage CASCADE;',
      'DROP TYPE IF EXISTS monster_style CASCADE;',
      'DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;',
    ];

    for (const statement of dropStatements) {
      await pool.query(statement);
      console.log(`  ✅ ${statement}`);
    }

    console.log('\n✨ All tables dropped successfully!\n');

    await pool.end();

    // Run migrations
    console.log('🚀 Running migrations...\n');
    execSync('npm run db:migrate', { stdio: 'inherit' });

  } catch (error) {
    console.error('\n❌ Reset failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run reset
resetDatabase();
