#!/usr/bin/env node

/**
 * Database migration runner
 * Runs all SQL migration files in the /migrations directory in order
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

async function runMigrations() {
  const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
  });

  try {
    console.log('🚀 Starting database migrations...\n');

    // Get all migration files and sort them
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('⚠️  No migration files found in /migrations');
      return;
    }

    console.log(`Found ${files.length} migration(s):\n`);

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`  📄 Running ${file}...`);

      try {
        await pool.query(sql);
        console.log(`  ✅ ${file} completed\n`);
      } catch (error) {
        console.error(`  ❌ Error in ${file}:`);
        console.error(`     ${error.message}\n`);

        // If it's a "already exists" error, it's likely safe to continue
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️  Skipping ${file} (objects already exist)\n`);
          continue;
        }

        throw error;
      }
    }

    console.log('✨ All migrations completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
runMigrations();
