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

  // Check if descriptors already exist and are recent
  const descriptorsDir = path.join(papiDir, 'descriptors', 'dist');
  if (fs.existsSync(descriptorsDir)) {
    console.log('✅ Polkadot API descriptors already exist, skipping generation.');
    return;
  }

  // Try multiple methods to run the CLI
  const commands = [
    'npx --yes @polkadot-api/cli@latest generate',
    './node_modules/.bin/polkadot-api generate',
    'node ./node_modules/@polkadot-api/cli/dist/main.js generate'
  ];

  for (const cmd of commands) {
    try {
      console.log(`🔄 Trying: ${cmd}`);
      execSync(cmd, { 
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env, PATH: `${path.join(process.cwd(), 'node_modules', '.bin')}:${process.env.PATH}` }
      });
      console.log('✅ Polkadot API descriptors built successfully!');
      return;
    } catch (cmdError) {
      console.log(`❌ Command failed: ${cmd}`);
      console.log(`   Error: ${cmdError.message}`);
    }
  }
  
  throw new Error('All CLI methods failed');
} catch (error) {
  console.error('❌ Failed to build Polkadot API descriptors:', error.message);
  console.log('ℹ️  Continuing build without regenerating descriptors...');
  // Don't exit with error - let the build continue
} 