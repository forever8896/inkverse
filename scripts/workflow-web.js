#!/usr/bin/env node
/**
 * Workflow Web UI Launcher
 * Opens the workflow web UI with correct configuration for this project
 */

const { spawn, exec } = require('child_process');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(PROJECT_ROOT, '.next', 'workflow-data');
const DEV_PORT = 3004;
const WEB_PORT = 3456;

// Build the URL with correct params
const params = new URLSearchParams({
  port: DEV_PORT.toString(),
  dataDir: DATA_DIR
});
const url = `http://localhost:${WEB_PORT}/?${params.toString()}`;

console.log('🔧 Starting Workflow Web UI...');
console.log(`   Dev Server Port: ${DEV_PORT}`);
console.log(`   Data Directory: ${DATA_DIR}`);
console.log(`   Web UI: ${url}`);
console.log('');

// Set PORT env var and start the workflow web server
const env = { ...process.env, PORT: DEV_PORT.toString() };

const child = spawn('npx', ['workflow', 'web', '--webPort', WEB_PORT.toString(), '--noBrowser'], {
  env,
  stdio: 'inherit',
  cwd: PROJECT_ROOT
});

// Wait a moment then open browser
setTimeout(() => {
  const openCmd = process.platform === 'darwin' ? 'open' :
                  process.platform === 'win32' ? 'start' : 'xdg-open';
  exec(`${openCmd} "${url}"`, (err) => {
    if (err) {
      console.log(`\n📎 Open manually: ${url}\n`);
    }
  });
}, 2000);

child.on('error', (err) => {
  console.error('Failed to start workflow web:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  child.kill('SIGINT');
  process.exit(0);
});
