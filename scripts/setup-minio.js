#!/usr/bin/env node
/**
 * MinIO Setup Script for Local S3-Compatible Storage
 * Sets up MinIO server with required buckets for monster generation
 */

const { spawn } = require('child_process');
const { Client } = require('minio');
const path = require('path');
const fs = require('fs');

const MINIO_CONFIG = {
  port: 9000,
  consolePort: 9001,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin',
  buckets: ['monsters-dev', 'monsters-prod']
};

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warn: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}[MinIO] ${message}${colors.reset}`);
}

async function checkMinIOInstalled() {
  return new Promise((resolve) => {
    const check = spawn('which', ['minio'], { stdio: 'pipe' });
    check.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

async function installMinIO() {
  log('MinIO not found. Installing MinIO server...', 'warn');
  
  const platform = process.platform;
  let installCommand;
  
  if (platform === 'darwin') {
    installCommand = spawn('brew', ['install', 'minio/stable/minio'], { stdio: 'inherit' });
  } else if (platform === 'linux') {
    log('Please install MinIO manually: https://min.io/docs/minio/linux/index.html', 'error');
    process.exit(1);
  } else {
    log('Please install MinIO manually: https://min.io/docs/minio/windows/index.html', 'error');
    process.exit(1);
  }
  
  return new Promise((resolve, reject) => {
    installCommand.on('close', (code) => {
      if (code === 0) {
        log('MinIO installed successfully!', 'success');
        resolve();
      } else {
        reject(new Error('Failed to install MinIO'));
      }
    });
  });
}

function startMinIOServer() {
  log('Starting MinIO server...', 'info');
  
  const dataDir = path.join(process.cwd(), '.minio-data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const minioProcess = spawn('minio', [
    'server',
    dataDir,
    '--address', `:${MINIO_CONFIG.port}`,
    '--console-address', `:${MINIO_CONFIG.consolePort}`
  ], { 
    stdio: 'pipe',
    env: {
      ...process.env,
      MINIO_ROOT_USER: MINIO_CONFIG.accessKey,
      MINIO_ROOT_PASSWORD: MINIO_CONFIG.secretKey
    }
  });
  
  minioProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('API:') || output.includes('Console:')) {
      log(output.trim(), 'info');
    }
  });
  
  minioProcess.stderr.on('data', (data) => {
    const error = data.toString();
    if (!error.includes('Unable to validate credentials')) {
      log(error.trim(), 'error');
    }
  });
  
  return minioProcess;
}

async function waitForMinIO() {
  log('Waiting for MinIO to start...', 'info');
  
  const minioClient = new Client({
    endPoint: 'localhost',
    port: MINIO_CONFIG.port,
    useSSL: false,
    accessKey: MINIO_CONFIG.accessKey,
    secretKey: MINIO_CONFIG.secretKey
  });
  
  for (let i = 0; i < 30; i++) {
    try {
      await minioClient.listBuckets();
      log('MinIO server is ready!', 'success');
      return minioClient;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('MinIO server failed to start within 30 seconds');
}

async function createBuckets(minioClient) {
  log('Creating required buckets...', 'info');
  
  for (const bucketName of MINIO_CONFIG.buckets) {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
        log(`Created bucket: ${bucketName}`, 'success');
      } else {
        log(`Bucket already exists: ${bucketName}`, 'info');
      }
    } catch (error) {
      log(`Failed to create bucket ${bucketName}: ${error.message}`, 'error');
    }
  }
}

async function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  const minioVars = [
    'S3_ENDPOINT=http://localhost:9000',
    'S3_ACCESS_KEY=minioadmin',
    'S3_SECRET_KEY=minioadmin',
    'S3_BUCKET=monsters-dev',
    'S3_REGION=us-east-1'
  ];
  
  let updated = false;
  for (const minioVar of minioVars) {
    const [key] = minioVar.split('=');
    if (!envContent.includes(`${key}=`)) {
      envContent += `\n${minioVar}`;
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(envPath, envContent);
    log('Updated .env.local with MinIO configuration', 'success');
  }
}

async function main() {
  try {
    log('Setting up MinIO for local S3-compatible storage...', 'info');
    
    // Check if MinIO is installed
    const isInstalled = await checkMinIOInstalled();
    if (!isInstalled) {
      await installMinIO();
    }
    
    // Start MinIO server
    const minioProcess = startMinIOServer();
    
    // Wait for server to be ready
    const minioClient = await waitForMinIO();
    
    // Create buckets
    await createBuckets(minioClient);
    
    // Update environment file
    await updateEnvFile();
    
    log('MinIO setup complete!', 'success');
    log(`MinIO Server: http://localhost:${MINIO_CONFIG.port}`, 'info');
    log(`MinIO Console: http://localhost:${MINIO_CONFIG.consolePort}`, 'info');
    log(`Access Key: ${MINIO_CONFIG.accessKey}`, 'info');
    log(`Secret Key: ${MINIO_CONFIG.secretKey}`, 'info');
    log('Press Ctrl+C to stop the server', 'warn');
    
    // Keep the process running
    process.on('SIGINT', () => {
      log('Shutting down MinIO server...', 'warn');
      minioProcess.kill();
      process.exit(0);
    });
    
    // Keep the script running
    setInterval(() => {}, 1000);
    
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}