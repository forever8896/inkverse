/**
 * Compilation Worker
 *
 * Handles ink! contract compilation with:
 * - Process group management (proper cleanup)
 * - Timeout handling (clear timers on completion)
 * - Output capping (prevent memory exhaustion)
 * - Ephemeral workspaces (clean temp directories)
 */

import { Worker, Job } from 'bullmq';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  CompilationJobData,
  CompilationResult,
} from '../types/index.js';
import { getConnectionOptions } from '../queue/index.js';
import { getConfig } from '../config.js';
import {
  parseCompilerOutput,
  categorizeByLevel,
} from './error-parser.js';
import { generateWorkspaceName } from '../validators/contract.js';

// ============================================================================
// Cargo.toml Template for ink! v6
// ============================================================================

const CARGO_TOML_TEMPLATE = `[package]
name = "contract_check"
version = "0.1.0"
edition = "2021"

[dependencies]
ink = { version = "6.0.0-alpha", default-features = false, features = ["unstable-hostfn"] }

[lib]
path = "lib.rs"

[features]
default = ["std"]
std = ["ink/std"]

[profile.dev]
incremental = true
codegen-units = 256
`;

// ============================================================================
// Worker Creation
// ============================================================================

export function createCompilationWorker(): Worker<
  CompilationJobData,
  CompilationResult
> {
  const config = getConfig();

  const worker = new Worker<CompilationJobData, CompilationResult>(
    'ink-compilation',
    async (job: Job<CompilationJobData>) => {
      return await processCompilationJob(job);
    },
    {
      connection: getConnectionOptions(),
      concurrency: config.workerConcurrency,
      limiter: {
        max: 10, // Max 10 jobs per minute
        duration: 60000,
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err.message);
  });

  return worker;
}

// ============================================================================
// Job Processing
// ============================================================================

async function processCompilationJob(
  job: Job<CompilationJobData>
): Promise<CompilationResult> {
  const config = getConfig();
  const startTime = Date.now();
  const workDir = path.join(config.tempDir, generateWorkspaceName());

  console.log(`[Worker] Processing job ${job.id} in ${workDir}`);

  try {
    // Progress: Starting
    await job.updateProgress(10);

    // Setup workspace
    await setupWorkspace(workDir, job.data.code);
    await job.updateProgress(20);

    // Run compilation
    const result = await runCompilation(workDir, job, config);
    await job.updateProgress(90);

    // Parse results
    const diagnostics = parseCompilerOutput(result.stdout, result.stderr);
    const { errors, warnings } = categorizeByLevel(diagnostics);
    const duration = Date.now() - startTime;

    await job.updateProgress(100);

    return {
      success: result.exitCode === 0,
      errors,
      warnings,
      stdout: result.stdout,
      stderr: result.stderr,
      duration,
    };
  } finally {
    // Always cleanup workspace
    await cleanupWorkspace(workDir);
  }
}

// ============================================================================
// Workspace Management
// ============================================================================

async function setupWorkspace(workDir: string, code: string): Promise<void> {
  // Create directory
  await fs.mkdir(workDir, { recursive: true });

  // Write Cargo.toml
  await fs.writeFile(path.join(workDir, 'Cargo.toml'), CARGO_TOML_TEMPLATE);

  // Write lib.rs
  await fs.writeFile(path.join(workDir, 'lib.rs'), code);
}

async function cleanupWorkspace(workDir: string): Promise<void> {
  try {
    await fs.rm(workDir, { recursive: true, force: true });
  } catch (err) {
    console.warn(`[Worker] Failed to cleanup ${workDir}:`, err);
  }
}

// ============================================================================
// Compilation Execution
// ============================================================================

interface CompilationOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
}

async function runCompilation(
  workDir: string,
  job: Job<CompilationJobData>,
  config: { compilationTimeout: number; maxOutputSize: number; cargoHome: string; targetDir: string }
): Promise<CompilationOutput> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let killed = false;
    let timeoutHandle: NodeJS.Timeout | null = null;
    let child: ChildProcess | null = null;

    // Clean environment - only essential variables
    const cleanEnv: Record<string, string> = {
      PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
      HOME: process.env.HOME || '/root',
      CARGO_HOME: config.cargoHome,
      CARGO_TARGET_DIR: config.targetDir,
      CARGO_INCREMENTAL: '1',
      // In production, enable offline mode after cache warming
      // CARGO_NET_OFFLINE: 'true',
      // Use JSON output for better error parsing
      CARGO_TERM_COLOR: 'never',
    };

    // Spawn process in its own process group for reliable cleanup
    // Note: cargo contract check doesn't support --message-format=json
    // so we use text-based error parsing
    child = spawn('cargo', ['contract', 'check'], {
      cwd: workDir,
      env: cleanEnv,
      detached: true, // Create new process group
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const pid = child.pid;

    // Timeout handler - kill process group
    timeoutHandle = setTimeout(() => {
      if (child && !child.killed && pid) {
        killed = true;
        console.log(`[Worker] Killing timed out process group ${pid}`);
        try {
          // Kill the entire process group (negative PID)
          process.kill(-pid, 'SIGKILL');
        } catch (err) {
          // Process might already be dead
          console.warn(`[Worker] Failed to kill process group:`, err);
        }
      }
    }, config.compilationTimeout);

    // Collect stdout with size limit
    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      if (stdout.length < config.maxOutputSize) {
        stdout += chunk.slice(0, config.maxOutputSize - stdout.length);
      }

      // Emit progress for SSE streaming
      job.updateProgress({
        stage: 'compiling',
        output: chunk,
      }).catch(() => {
        // Ignore progress update errors
      });
    });

    // Collect stderr with size limit
    child.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      if (stderr.length < config.maxOutputSize) {
        stderr += chunk.slice(0, config.maxOutputSize - stderr.length);
      }

      job.updateProgress({
        stage: 'compiling',
        output: chunk,
      }).catch(() => {
        // Ignore progress update errors
      });
    });

    // Handle process completion
    child.on('close', (code, signal) => {
      // IMPORTANT: Clear timeout to prevent killing wrong PID later
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      const exitCode = killed ? 137 : code ?? 1;

      console.log(
        `[Worker] Process closed: code=${code}, signal=${signal}, killed=${killed}`
      );

      resolve({
        stdout,
        stderr,
        exitCode,
      });
    });

    // Handle spawn errors
    child.on('error', (err) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
        timeoutHandle = null;
      }

      console.error(`[Worker] Spawn error:`, err);
      reject(err);
    });
  });
}

// ============================================================================
// Worker Lifecycle
// ============================================================================

let worker: Worker<CompilationJobData, CompilationResult> | null = null;

export function startWorker(): Worker<CompilationJobData, CompilationResult> {
  if (!worker) {
    worker = createCompilationWorker();
    console.log('[Worker] Started');
  }
  return worker;
}

export async function stopWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = null;
    console.log('[Worker] Stopped');
  }
}
