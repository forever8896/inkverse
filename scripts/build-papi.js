#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Building Polkadot API descriptors...');

try {
  // Ensure .papi directory exists
  const papiDir = path.join(process.cwd(), '.papi');
  if (!fs.existsSync(papiDir)) {
    console.error('❌ .papi directory not found. Please run from project root.');
    process.exit(1);
  }

  // Run polkadot-api CLI
  execSync('npx @polkadot-api/cli generate', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Polkadot API descriptors built successfully!');
} catch (error) {
  console.error('❌ Failed to build Polkadot API descriptors:', error.message);
  process.exit(1);
} 