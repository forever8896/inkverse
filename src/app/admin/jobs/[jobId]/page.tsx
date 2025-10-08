'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import MonsterViewer from '@/components/MonsterViewer';

interface JobDetail {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  prompt: string;
  style: string;
  stage: string;
  status: string;
  progress: number;
  errorMessage?: string;
  userMessage?: string;
  imageS3Key?: string;
  imageUrl?: string;
  glbS3Key?: string;
  glbUrl?: string;
  totalCost: number;
  retryCount: number;
  lastError?: {
    type: string;
    userMessage: string;
    technicalMessage: string;
    retryable: boolean;
    maxRetries: number;
    currentRetries: number;
    lastRetryAt: string;
    suggestedRetryDelay: number; // ADDED: seconds to wait between retries
  };
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface JobDetailResponse {
  success: boolean;
  job?: JobDetail;
  error?: string;
}

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  generating_image: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
  image_generation_failed: 'bg-red-500/20 text-red-300 border-red-500/50',
  image_generation_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  converting_3d: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
  conversion_failed: 'bg-red-500/20 text-red-300 border-red-500/50',
  conversion_retrying: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
  completed: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50',
  failed_permanent: 'bg-slate-500/20 text-slate-300 border-slate-500/50',
  waiting_on_storage: 'bg-amber-500/20 text-amber-300 border-amber-500/50'
};

const statusEmojis = {
  pending: '🥚',
  generating_image: '🎨',
  image_generation_failed: '❌',
  image_generation_retrying: '🔄',
  converting_3d: '🏗️',
  conversion_failed: '❌',
  conversion_retrying: '🔄',
  completed: '✅',
  failed_permanent: '💀',
  waiting_on_storage: '🧰'
};

// Error type explanations
const ERROR_EXPLANATIONS: Record<string, { reason: string; strategy: string }> = {
  openai_rate_limit: {
    reason: 'OpenAI API is receiving too many requests',
    strategy: 'Waiting for rate limit to reset before retrying'
  },
  openai_network_timeout: {
    reason: 'Connection to OpenAI timed out',
    strategy: 'Network hiccup detected, retrying with backoff'
  },
  openai_api_error: {
    reason: 'OpenAI service returned an error',
    strategy: 'Temporary service issue, retrying after delay'
  },
  openai_content_policy: {
    reason: 'Content violates OpenAI policies',
    strategy: 'Not retryable - requires user intervention'
  },
  openai_invalid_api_key: {
    reason: 'OpenAI API key is invalid or expired',
    strategy: 'Not retryable - requires admin to fix credentials'
  },
  openai_insufficient_quota: {
    reason: 'OpenAI account quota exhausted',
    strategy: 'Not retryable - requires account top-up'
  },
  fal_overloaded: {
    reason: 'fal.ai service is experiencing high demand',
    strategy: 'Retrying with extended backoff (up to 10 attempts)'
  },
  fal_network_timeout: {
    reason: '3D conversion took too long',
    strategy: 'Retrying with timeout tolerance'
  },
  fal_api_error: {
    reason: 'fal.ai service error',
    strategy: 'Waiting for service recovery before retry'
  },
  fal_invalid_api_key: {
    reason: 'fal.ai API key is invalid',
    strategy: 'Not retryable - requires admin to fix credentials'
  },
  fal_insufficient_quota: {
    reason: 'fal.ai credits depleted',
    strategy: 'Not retryable - requires account top-up'
  },
  s3_upload_error: {
    reason: 'File upload to storage failed',
    strategy: 'Retrying upload operation'
  },
  s3_storage_unavailable: {
    reason: 'Storage service is unreachable',
    strategy: 'Job paused until storage comes online'
  },
  database_error: {
    reason: 'Database operation failed',
    strategy: 'Retrying database operation'
  },
  unknown: {
    reason: 'Unexpected error occurred',
    strategy: 'Generic retry with backoff'
  }
};

// Calculate seconds until next retry
function calculateSecondsUntilRetry(job: JobDetail): number {
  if (!job.lastError?.lastRetryAt) return 0;

  const now = new Date();
  const lastRetry = new Date(job.lastError.lastRetryAt);
  const elapsedSeconds = Math.floor((now.getTime() - lastRetry.getTime()) / 1000);
  const delaySeconds = job.lastError.suggestedRetryDelay || 0;

  return Math.max(0, delaySeconds - elapsedSeconds);
}

// Calculate timeout threshold for stuck jobs (matches server logic)
function calculateTimeoutThreshold(job: JobDetail): number {
  const suggestedDelay = job.lastError?.suggestedRetryDelay ?? 30;
  return Math.max(suggestedDelay * 2, 120); // At least 2 minutes
}

// Check if job is stuck in retrying state
function isJobStuck(job: JobDetail): boolean {
  if (!job.status.includes('retrying')) return false;

  const timeSinceUpdate = (Date.now() - new Date(job.updatedAt).getTime()) / 1000;
  const timeoutThreshold = calculateTimeoutThreshold(job);

  return timeSinceUpdate > timeoutThreshold;
}

// Format seconds into human-readable duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

// Expected max duration for each status (in seconds)
const EXPECTED_STATUS_DURATION: Record<string, number> = {
  pending: 30, // Should start processing within 30s
  generating_image: 120, // OpenAI typically takes 30-90s
  converting_3d: 300, // fal.ai can take 2-5 minutes
  image_generation_retrying: 600, // Should retry within 10min (accounting for max delay)
  conversion_retrying: 600, // Should retry within 10min
  waiting_on_storage: Infinity, // Can wait indefinitely for storage
  image_generation_failed: Infinity, // Terminal state
  conversion_failed: Infinity, // Terminal state
  completed: Infinity, // Terminal state
  failed_permanent: Infinity, // Terminal state
};

// Detect anomalies in job state
function detectJobAnomalies(job: JobDetail): string[] {
  const anomalies: string[] = [];
  const now = Date.now();
  const createdTime = new Date(job.createdAt).getTime();
  const updatedTime = new Date(job.updatedAt).getTime();
  const timeSinceUpdate = Math.floor((now - updatedTime) / 1000);
  const timeSinceCreation = Math.floor((now - createdTime) / 1000);

  // ═══════════ STATUS & ERROR STATE ANOMALIES ═══════════

  // ANOMALY 1: Status suggests error but no lastError recorded
  const errorStatuses = ['image_generation_failed', 'conversion_failed', 'image_generation_retrying', 'conversion_retrying'];
  if (errorStatuses.includes(job.status) && !job.lastError) {
    anomalies.push(`⚠️ Job status is "${job.status}" but no error details are recorded (lastError is null)`);
  }

  // ANOMALY 2: Retry count mismatch
  if (job.lastError && job.retryCount !== job.lastError.currentRetries) {
    anomalies.push(`⚠️ Retry count mismatch: job.retryCount=${job.retryCount} but lastError.currentRetries=${job.lastError.currentRetries}`);
  }

  // ANOMALY 3: retryCount exceeds maxRetries but still retrying
  if (job.lastError && job.lastError.currentRetries > job.lastError.maxRetries) {
    anomalies.push(`🔴 Retry count (${job.lastError.currentRetries}) exceeds max retries (${job.lastError.maxRetries}) - should be marked as failed`);
  }

  // ANOMALY 4: Non-retryable error but status is retrying
  if (job.status.includes('retrying') && job.lastError && !job.lastError.retryable) {
    anomalies.push(`🔴 Job is retrying but error type "${job.lastError.type}" is marked as non-retryable`);
  }

  // ANOMALY 5: lastRetryAt missing for retrying status
  if (job.status.includes('retrying') && !job.lastError?.lastRetryAt) {
    anomalies.push(`🔴 Job status is "${job.status}" but lastRetryAt is missing - cannot calculate retry timing`);
  }

  // ANOMALY 6: Invalid retry delay
  if (job.lastError?.suggestedRetryDelay !== undefined && job.lastError.suggestedRetryDelay <= 0) {
    anomalies.push(`🔴 suggestedRetryDelay is ${job.lastError.suggestedRetryDelay} - should be positive number`);
  }

  // ANOMALY 7: maxRetries is 0 but status is retrying
  if (job.status.includes('retrying') && job.lastError?.maxRetries === 0) {
    anomalies.push(`🔴 Job is retrying but maxRetries is 0 - invalid configuration`);
  }

  // ═══════════ TIMING ANOMALIES ═══════════

  // ANOMALY 8: Job stuck in active processing state too long
  const activeStatuses = ['generating_image', 'converting_3d'];
  if (activeStatuses.includes(job.status)) {
    const expectedMax = EXPECTED_STATUS_DURATION[job.status] || 300;
    if (timeSinceUpdate > expectedMax) {
      anomalies.push(`🔴 Job has been "${job.status}" for ${formatDuration(timeSinceUpdate)} (expected max: ${formatDuration(expectedMax)}) - likely stuck or timed out`);
    }
  }

  // ANOMALY 9: Job stuck in pending too long
  if (job.status === 'pending' && timeSinceUpdate > EXPECTED_STATUS_DURATION.pending) {
    anomalies.push(`🔴 Job has been pending for ${formatDuration(timeSinceUpdate)} - should have started processing within 30s`);
  }

  // ANOMALY 10: Countdown at 0 for too long (stuck in "retrying now" state)
  if (job.status.includes('retrying') && job.lastError?.lastRetryAt) {
    const secondsUntilRetry = calculateSecondsUntilRetry(job);
    if (secondsUntilRetry === 0 && timeSinceUpdate > 60) {
      anomalies.push(`🔴 Job ready to retry but hasn't started for ${formatDuration(timeSinceUpdate)} - possible processing deadlock or JobProcessor crash`);
    }
  }

  // ANOMALY 11: Very old job (>1 hour)
  if (timeSinceUpdate > 3600) {
    anomalies.push(`⚠️ Job hasn't updated in ${formatDuration(timeSinceUpdate)} - may be abandoned or stuck`);
  }

  // ANOMALY 12: Job running for extremely long time (>24 hours)
  if (timeSinceCreation > 86400 && job.status !== 'completed' && job.status !== 'failed_permanent') {
    anomalies.push(`🔴 Job has been running for ${formatDuration(timeSinceCreation)} - likely stuck in infinite loop`);
  }

  // ANOMALY 13: lastRetryAt is in the future (clock skew)
  if (job.lastError?.lastRetryAt) {
    const lastRetryTime = new Date(job.lastError.lastRetryAt).getTime();
    if (lastRetryTime > now + 5000) { // 5 second tolerance
      const futureSeconds = Math.floor((lastRetryTime - now) / 1000);
      anomalies.push(`⚠️ lastRetryAt is ${formatDuration(futureSeconds)} in the future - server/client clock skew detected`);
    }
  }

  // ANOMALY 14: Temporal paradoxes
  if (updatedTime < createdTime) {
    anomalies.push(`🔴 updatedAt (${new Date(updatedTime).toISOString()}) is BEFORE createdAt (${new Date(createdTime).toISOString()}) - database corruption`);
  }

  if (job.completedAt) {
    const completedTime = new Date(job.completedAt).getTime();
    if (completedTime < createdTime) {
      anomalies.push(`🔴 completedAt is BEFORE createdAt - impossible timeline`);
    }
  }

  // ═══════════ FILE & OUTPUT ANOMALIES ═══════════

  // ANOMALY 15: Completed but missing files
  if (job.status === 'completed') {
    if (!job.imageUrl && !job.imageS3Key) {
      anomalies.push(`🔴 Job marked completed but image file is completely missing (no S3 key or URL)`);
    }
    if (!job.glbUrl && !job.glbS3Key && job.imageUrl) {
      anomalies.push(`⚠️ Job marked completed but 3D model is missing (might be image-only job, or conversion failed silently)`);
    }
  }

  // ANOMALY 16: S3 key exists but URL missing (presigned URL generation failure)
  if (job.imageS3Key && !job.imageUrl) {
    anomalies.push(`⚠️ Image S3 key exists (${job.imageS3Key}) but presigned URL is missing - URL generation may have failed`);
  }
  if (job.glbS3Key && !job.glbUrl) {
    anomalies.push(`⚠️ GLB S3 key exists (${job.glbS3Key}) but presigned URL is missing - URL generation may have failed`);
  }

  // ANOMALY 17: URL exists but S3 key missing (inconsistent state)
  if (job.imageUrl && !job.imageS3Key) {
    anomalies.push(`⚠️ Image URL exists but S3 key is missing - inconsistent storage state`);
  }
  if (job.glbUrl && !job.glbS3Key) {
    anomalies.push(`⚠️ GLB URL exists but S3 key is missing - inconsistent storage state`);
  }

  // ANOMALY 18: Files exist but wrong status
  if ((job.imageS3Key || job.glbS3Key) && job.status === 'pending') {
    anomalies.push(`🔴 Job has generated files but status is still "pending" - status update failed`);
  }

  // ANOMALY 19: Has GLB but no image (impossible - 3D needs image input)
  if (job.glbS3Key && !job.imageS3Key) {
    anomalies.push(`🔴 Job has 3D model but no image - impossible state (3D conversion requires image input)`);
  }

  // ═══════════ PROGRESS ANOMALIES ═══════════

  // ANOMALY 20: Progress is 100 but status is not completed
  if (job.progress === 100 && job.status !== 'completed') {
    anomalies.push(`🔴 Progress is 100% but status is "${job.status}" - should be "completed"`);
  }

  // ANOMALY 21: Progress is 0 but status suggests work done
  if (job.progress === 0 && (job.imageS3Key || job.glbS3Key)) {
    anomalies.push(`⚠️ Progress is 0% but files exist - progress tracking failed`);
  }

  // ANOMALY 22: Progress exceeds 100
  if (job.progress > 100) {
    anomalies.push(`🔴 Progress is ${job.progress}% - should never exceed 100%`);
  }

  // ANOMALY 23: Progress is negative
  if (job.progress < 0) {
    anomalies.push(`🔴 Progress is ${job.progress}% - should never be negative`);
  }

  // ANOMALY 24: Completed status but progress < 100
  if (job.status === 'completed' && job.progress < 100) {
    anomalies.push(`⚠️ Job marked completed but progress is only ${job.progress}%`);
  }

  // ═══════════ COST ANOMALIES ═══════════

  // ANOMALY 25: Zero cost but job completed with files
  if (job.status === 'completed' && job.totalCost === 0 && (job.imageS3Key || job.glbS3Key)) {
    anomalies.push(`⚠️ Job completed with files but totalCost is $0.00 - cost tracking may have failed`);
  }

  // ANOMALY 26: Abnormally high cost (>$2)
  if (job.totalCost > 2.0) {
    anomalies.push(`🔴 Extremely high cost: $${job.totalCost.toFixed(2)} - possible infinite retry loop or pricing error`);
  }

  // ANOMALY 27: Negative cost
  if (job.totalCost < 0) {
    anomalies.push(`🔴 Negative cost: $${job.totalCost.toFixed(2)} - database corruption`);
  }

  // ═══════════ STATE CONSISTENCY ANOMALIES ═══════════

  // ANOMALY 28: Status/progress mismatch for image generation
  if (job.status === 'generating_image' && job.progress > 40) {
    anomalies.push(`⚠️ Status is "generating_image" but progress is ${job.progress}% - should be ≤40% during image gen`);
  }

  // ANOMALY 29: Status/progress mismatch for 3D conversion
  if (job.status === 'converting_3d' && (job.progress < 40 || job.progress > 90)) {
    anomalies.push(`⚠️ Status is "converting_3d" but progress is ${job.progress}% - should be 40-90% during 3D conversion`);
  }

  // ANOMALY 30: Converting 3D but no image
  if (job.status === 'converting_3d' && !job.imageS3Key) {
    anomalies.push(`🔴 Job is converting to 3D but no image file exists - cannot convert without source image`);
  }

  // ANOMALY 31: Image generation failed but has image
  if (job.status === 'image_generation_failed' && job.imageS3Key) {
    anomalies.push(`⚠️ Status is "image_generation_failed" but image file exists - conflicting state`);
  }

  // ANOMALY 32: Conversion failed but has GLB
  if (job.status === 'conversion_failed' && job.glbS3Key) {
    anomalies.push(`⚠️ Status is "conversion_failed" but 3D model exists - conflicting state`);
  }

  // ═══════════ ERROR MESSAGE ANOMALIES ═══════════

  // ANOMALY 33: errorMessage exists but lastError doesn't
  if (job.errorMessage && !job.lastError) {
    anomalies.push(`⚠️ errorMessage is set but lastError object is missing - incomplete error recording`);
  }

  // ANOMALY 34: lastError exists but no user message
  if (job.lastError && !job.lastError.userMessage) {
    anomalies.push(`⚠️ lastError exists but userMessage is empty - user has no feedback`);
  }

  return anomalies;
}

// Diagnostic Panel Component
function DiagnosticPanel({ job }: { job: JobDetail }) {
  const [anomalies, setAnomalies] = useState<string[]>(() => detectJobAnomalies(job));
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);
  const [timeSinceCreation, setTimeSinceCreation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnomalies(detectJobAnomalies(job));
      setTimeSinceUpdate(Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / 1000));
      setTimeSinceCreation(Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  const expectedMaxDuration = EXPECTED_STATUS_DURATION[job.status] ?? 300;
  const isOverdue = timeSinceUpdate > expectedMaxDuration && expectedMaxDuration !== Infinity;

  if (anomalies.length === 0 && !isOverdue) {
    return null; // No diagnostic issues to show
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
      <h3 className="font-pixel text-[10px] uppercase text-yellow-300 mb-4 tracking-wider">
        🔍 Diagnostic Info
      </h3>

      <div className="space-y-4">
        {/* Time in Current Status */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">Time in Current Status:</div>
          <div className="flex items-center justify-between">
            <div className="text-white font-mono text-lg">{formatDuration(timeSinceUpdate)}</div>
            {expectedMaxDuration !== Infinity && (
              <div className={`text-sm ${isOverdue ? 'text-red-300' : 'text-slate-400'}`}>
                Expected max: {formatDuration(expectedMaxDuration)}
              </div>
            )}
          </div>
          {isOverdue && (
            <div className="mt-2 text-xs text-red-300">
              ⚠️ Status has exceeded expected duration - job may be stuck
            </div>
          )}
        </div>

        {/* Total Job Duration */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">Total Job Duration:</div>
          <div className="text-white font-mono text-lg">{formatDuration(timeSinceCreation)}</div>
        </div>

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="text-xs font-medium text-red-200 mb-3 uppercase tracking-wide">
              Detected Anomalies:
            </div>
            <div className="space-y-2">
              {anomalies.map((anomaly, index) => (
                <div key={index} className="text-sm text-red-100 bg-red-900/20 rounded p-2 border border-red-500/20 font-mono text-xs">
                  {anomaly}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Behavior vs Actual */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs font-medium text-slate-300 mb-3 uppercase tracking-wide">What Should Be Happening:</div>
          <div className="space-y-2 text-xs">
            {job.status === 'pending' && (
              <div className="text-cyan-300">
                ✓ Next polling request should trigger JobProcessor.atomicStart()
                <br />✓ Job should transition to &quot;generating_image&quot; within 30 seconds
                <br />✓ Progress should update to 5-10%
              </div>
            )}
            {job.status === 'generating_image' && (
              <div className="text-cyan-300">
                ✓ ProductionPipelineOrchestrator.generateImageOnly() should be executing
                <br />✓ OpenAI DALL-E API call in progress (30-90s typical)
                <br />✓ On success: Upload to S3, update imageS3Key, transition to converting_3d
                <br />✓ On failure: Record error, transition to image_generation_failed
              </div>
            )}
            {job.status === 'image_generation_failed' && job.lastError && (
              <div className="text-orange-300">
                ✓ Job should wait {job.lastError.suggestedRetryDelay}s before retry
                <br />✓ After delay: Transition to image_generation_retrying
                <br />✓ JobProcessor should pick up job and restart image generation
                <br />✓ Max retries: {job.lastError.maxRetries}
              </div>
            )}
            {job.status === 'image_generation_retrying' && (
              <div className="text-orange-300">
                ✓ JobProcessor.canRetryNow() should return true after delay
                <br />✓ Job should be picked up by next polling request
                <br />✓ Should transition back to generating_image
              </div>
            )}
            {job.status === 'converting_3d' && (
              <div className="text-purple-300">
                ✓ ProductionPipelineOrchestrator.convertImageTo3D() should be executing
                <br />✓ fal.ai API processing (2-5min typical, up to 10min peak)
                <br />✓ On success: Upload GLB to S3, update glbS3Key, transition to completed
                <br />✓ On failure: Record error, transition to conversion_failed
              </div>
            )}
            {job.status === 'conversion_failed' && job.lastError && (
              <div className="text-orange-300">
                ✓ Job should wait {job.lastError.suggestedRetryDelay}s before retry
                <br />✓ After delay: Transition to conversion_retrying
                <br />✓ JobProcessor should restart 3D conversion (preserving existing image)
                <br />✓ Max retries: {job.lastError.maxRetries}
              </div>
            )}
            {job.status === 'conversion_retrying' && (
              <div className="text-orange-300">
                ✓ JobProcessor.canRetryNow() should return true after delay
                <br />✓ Job should be picked up by next polling request
                <br />✓ Should transition back to converting_3d
              </div>
            )}
            {job.status === 'completed' && (
              <div className="text-green-300">
                ✓ imageS3Key and glbS3Key should both exist
                <br />✓ Presigned URLs should be valid for 2 hours
                <br />✓ Progress should be 100%
                <br />✓ totalCost should be $0.20-$0.80 typically
              </div>
            )}
            {job.status === 'waiting_on_storage' && (
              <div className="text-amber-300">
                ✓ S3Service.checkBucketAccessibility() should be polled every 15s
                <br />✓ When storage comes online: Auto-transition to pending
                <br />✓ Processing will restart automatically
              </div>
            )}
          </div>
        </div>

        {/* System Health Context */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs font-medium text-slate-300 mb-3 uppercase tracking-wide">Possible Root Causes:</div>
          <div className="space-y-2 text-xs text-slate-400">
            {job.status === 'pending' && timeSinceUpdate > 30 && (
              <>
                <div>• Serverless function crashed before calling atomicStart()</div>
                <div>• Database connection pool exhausted</div>
                <div>• Race condition - another request already started job but failed</div>
              </>
            )}
            {(job.status === 'generating_image' || job.status === 'converting_3d') && timeSinceUpdate > 180 && (
              <>
                <div>• API request hanging without timeout (no fetch timeout set)</div>
                <div>• Serverless function exceeded Vercel timeout (10s Hobby, 60s Pro)</div>
                <div>• Provider API is down but not returning error</div>
                <div>• Network connectivity issues (DNS, firewall, routing)</div>
                <div>• Out of memory error in Node.js process</div>
              </>
            )}
            {job.status.includes('retrying') && calculateSecondsUntilRetry(job) === 0 && timeSinceUpdate > 60 && (
              <>
                <div>• JobProcessor.canRetryNow() returning false unexpectedly</div>
                <div>• Race condition: Multiple polling requests trying to start job</div>
                <div>• Database connection lost before job.update() could save</div>
                <div>• Exception in JobProcessor not being caught</div>
                <div>• Vercel function timeout during retry attempt</div>
              </>
            )}
            {anomalies.some(a => a.includes('clock skew')) && (
              <>
                <div>• Server and client system clocks not synchronized</div>
                <div>• Timezone misconfiguration (UTC vs local time)</div>
                <div>• Database server clock drift</div>
              </>
            )}
            {anomalies.some(a => a.includes('presigned URL')) && (
              <>
                <div>• S3Service.getPresignedUrl() failed silently</div>
                <div>• S3 credentials expired mid-generation</div>
                <div>• Bucket permissions changed during job processing</div>
              </>
            )}
            {anomalies.some(a => a.includes('database corruption')) && (
              <>
                <div>• Concurrent database updates without proper locking</div>
                <div>• Application bug writing incorrect timestamps</div>
                <div>• Direct database manipulation outside application</div>
              </>
            )}
            {job.totalCost > 2.0 && (
              <>
                <div>• Infinite retry loop not being caught</div>
                <div>• Retry counter not incrementing properly</div>
                <div>• Job being processed multiple times in parallel</div>
              </>
            )}
          </div>
        </div>

        {/* Recovery Actions */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <div className="text-xs font-medium text-slate-300 mb-3 uppercase tracking-wide">Recommended Actions:</div>
          <div className="space-y-2 text-xs text-slate-400">
            {job.status === 'pending' && timeSinceUpdate > 60 && (
              <div className="text-yellow-300">→ Click &quot;Reset to Pending&quot; to force pickup</div>
            )}
            {(job.status === 'generating_image' || job.status === 'converting_3d') && timeSinceUpdate > 300 && (
              <div className="text-yellow-300">→ Job likely timed out - click &quot;Reset to Pending&quot; to resume{job.imageS3Key && job.status === 'converting_3d' ? ' from 3D' : ''}</div>
            )}
            {job.status.includes('retrying') && calculateSecondsUntilRetry(job) === 0 && timeSinceUpdate > 120 && (
              <div className="text-yellow-300">→ Processing deadlock detected - click &quot;Reset to Pending&quot; to resume</div>
            )}
            {anomalies.some(a => a.includes('presigned URL')) && (
              <div className="text-cyan-300">→ Check S3 bucket permissions and credentials</div>
            )}
            {job.status === 'waiting_on_storage' && (
              <div className="text-amber-300">→ Start MinIO (npm run storage:start) or verify S3 connectivity</div>
            )}
            {job.totalCost > 1.5 && (
              <div className="text-red-300">→ High cost detected - investigate retry loop before resetting</div>
            )}
            {timeSinceCreation > 3600 && job.status !== 'completed' && (
              <div className="text-red-300">→ Job running for {formatDuration(timeSinceCreation)} - likely needs manual reset</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Retry Status Display Component
function RetryStatusCard({ job }: { job: JobDetail }) {
  const [secondsUntilRetry, setSecondsUntilRetry] = useState(() => calculateSecondsUntilRetry(job));
  const [timeoutWarning, setTimeoutWarning] = useState(() => isJobStuck(job));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsUntilRetry(calculateSecondsUntilRetry(job));
      setTimeoutWarning(isJobStuck(job));
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  const isRetrying = job.status.includes('retrying');
  const isFailed = job.status.includes('failed') && !isRetrying;
  const isWaitingOnStorage = job.status === 'waiting_on_storage';
  const canRetry = job.lastError?.retryable && (job.lastError.currentRetries < job.lastError.maxRetries);
  const errorInfo = job.lastError ? ERROR_EXPLANATIONS[job.lastError.type] || ERROR_EXPLANATIONS.unknown : null;
  const timeoutThreshold = calculateTimeoutThreshold(job);

  if (!job.lastError && !isRetrying && !isFailed && !isWaitingOnStorage) {
    return null; // No retry information to show
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
      <h3 className="font-pixel text-[10px] uppercase text-orange-300 mb-4 tracking-wider">
        🔄 Retry Status
      </h3>

      <div className="space-y-4">
        {/* Retry Progress */}
        {job.lastError && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-300">Retry Attempts:</span>
              <span className={`font-bold text-lg ${canRetry ? 'text-orange-300' : 'text-red-300'}`}>
                {job.lastError.currentRetries} / {job.lastError.maxRetries}
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  canRetry ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(job.lastError.currentRetries / job.lastError.maxRetries) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Explanation */}
        {errorInfo && (
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
            <div className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">Why This Happened:</div>
            <div className="text-white text-sm mb-3">{errorInfo.reason}</div>
            <div className="text-xs font-medium text-slate-300 mb-2 uppercase tracking-wide">Retry Strategy:</div>
            <div className="text-slate-300 text-sm">{errorInfo.strategy}</div>
          </div>
        )}

        {/* Countdown or Status */}
        {isRetrying && canRetry && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-orange-200 font-medium">Next Retry In:</span>
              {secondsUntilRetry > 0 ? (
                <motion.span
                  key={secondsUntilRetry}
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-orange-300 font-mono"
                >
                  {formatDuration(secondsUntilRetry)}
                </motion.span>
              ) : (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xl font-bold text-green-300"
                >
                  Retrying now...
                </motion.span>
              )}
            </div>
            {job.lastError && secondsUntilRetry > 0 && (
              <div className="text-xs text-orange-300/70 mt-2">
                Configured delay: {formatDuration(job.lastError.suggestedRetryDelay)}
              </div>
            )}
          </div>
        )}

        {/* Timeout Warning */}
        {timeoutWarning && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">⚠️</span>
              <span className="text-yellow-200 font-medium">Job May Be Stuck</span>
            </div>
            <div className="text-sm text-yellow-100 mb-2">
              This job has been in retrying state for longer than expected.
            </div>
            <div className="text-xs text-yellow-300/70">
              Timeout threshold: {formatDuration(timeoutThreshold)} •
              Time since update: {formatDuration(Math.floor((Date.now() - new Date(job.updatedAt).getTime()) / 1000))}
            </div>
            <div className="text-xs text-yellow-200 mt-2">
              The system will automatically mark this as failed and retry if it remains stuck.
            </div>
          </div>
        )}

        {/* Waiting on Storage */}
        {isWaitingOnStorage && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">🧰</span>
              <span className="text-amber-200 font-medium">Storage Service Unavailable</span>
            </div>
            <div className="text-sm text-amber-100 mb-3">
              Job is paused because the storage service (S3/MinIO) cannot be reached. The job will automatically resume once storage comes back online.
            </div>
            <div className="text-xs text-amber-300/70 bg-amber-900/20 rounded p-2 border border-amber-500/20">
              <strong>Action Required:</strong> {' '}
              {process.env.NEXT_PUBLIC_S3_ENDPOINT || job.lastError?.technicalMessage?.includes('MinIO')
                ? 'Start MinIO locally with `npm run storage:start`'
                : 'Verify S3 connectivity and check firewall/network settings'}
            </div>
          </div>
        )}

        {/* Failed - No More Retries */}
        {isFailed && job.lastError && !canRetry && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <span className="text-xl mr-2">❌</span>
              <span className="text-red-200 font-medium">
                {job.lastError.retryable ? 'Max Retries Exhausted' : 'Not Retryable'}
              </span>
            </div>
            <div className="text-sm text-red-100">
              {job.lastError.retryable
                ? `Failed after ${job.lastError.currentRetries} retry attempts. Manual intervention required.`
                : 'This error type cannot be automatically retried. Please check the error details and fix the underlying issue.'}
            </div>
          </div>
        )}

        {/* Retry Config Details */}
        {job.lastError && (
          <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-700/30">
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Retryable</div>
              <div className={`text-sm font-bold ${job.lastError.retryable ? 'text-green-300' : 'text-red-300'}`}>
                {job.lastError.retryable ? 'Yes' : 'No'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Retry Delay</div>
              <div className="text-sm font-bold text-cyan-300">
                {formatDuration(job.lastError.suggestedRetryDelay)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-400 mb-1">Max Retries</div>
              <div className="text-sm font-bold text-purple-300">
                {job.lastError.maxRetries}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminJobDetail() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchJobDetail();
  }, [jobId]);

  useEffect(() => {
    if (!autoRefresh || !job || job.status === 'completed' || job.status === 'failed_permanent') return;

    const interval = setInterval(() => {
      fetchJobDetail();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, autoRefresh, job?.status]);

  const fetchJobDetail = async () => {
    try {
      const response = await fetch(`/api/admin/jobs/${jobId}`);
      const data: JobDetailResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch job details');
      }

      setJob(data.job || null);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to fetch job details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!job) return;

    if (!confirm(`Are you sure you want to delete job ${job.id}? This action cannot be undone and will delete all associated files.`)) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/jobs/${jobId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }

      router.push('/admin/jobs');
    } catch (err: unknown) {
      console.error('Failed to delete job:', err);
      alert(`Failed to delete job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleResetJob = async () => {
    if (!job) return;

    const hasImage = !!job.imageS3Key;
    const resumePoint = hasImage ? 'RESUME from 3D conversion (image already exists)' : 'start from image generation';

    const confirmMessage = `Reset job ${job.id} back to PENDING status?\n\nThis will:\n• Clear all error states and retry counters\n• ${resumePoint}\n• Preserve any existing files (saves money!)\n\nExisting files will NOT be regenerated.\nContinue?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setResetting(true);
      const response = await fetch(`/api/admin/jobs/${jobId}/reset`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset job');
      }

      // Refresh job details
      await fetchJobDetail();
      alert('Job reset successfully. Processing will restart automatically.');
    } catch (err: unknown) {
      console.error('Failed to reset job:', err);
      alert(`Failed to reset job: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || 'bg-slate-500/20 text-slate-300 border-slate-500/50';
  };

  const getStatusEmoji = (status: string) => {
    return statusEmojis[status as keyof typeof statusEmojis] || '❓';
  };

  const calculateJobDuration = () => {
    if (!job) return null;

    const start = new Date(job.createdAt);
    const end = job.completedAt ? new Date(job.completedAt) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const minutes = Math.floor(durationMs / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <motion.div
            className="w-16 h-16 border-4 border-purple-500/50 border-t-purple-400 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <h2 className="text-xl font-bold text-white font-pixel uppercase text-[10px] tracking-wider">Loading...</h2>
        </motion.div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto px-6"
        >
          <div className="text-6xl mb-6">😔</div>
          <h2 className="text-2xl font-bold text-white mb-4">Job Not Found</h2>
          <p className="text-slate-300 mb-8">{error || 'The requested job could not be found.'}</p>
          <Link
            href="/admin/jobs"
            className="inline-block px-6 py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 font-pixel text-[8px] uppercase transition-all"
          >
            ← Back to Jobs
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between mb-8 flex-wrap gap-4"
        >
          <div>
            <Link
              href="/admin/jobs"
              className="text-purple-400 hover:text-purple-300 mb-4 inline-block font-pixel text-[8px] uppercase tracking-wider transition-colors"
            >
              ← Back
            </Link>
            <h1 className="font-pixel text-[18px] uppercase text-purple-300 tracking-wider mb-2">🔍 Job Details</h1>
            <p className="text-slate-400 text-sm font-mono">{jobId}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center text-slate-300 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="mr-2"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchJobDetail}
              className="px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded-lg text-cyan-300 hover:text-cyan-100 font-pixel text-[8px] uppercase transition-all"
            >
              🔄 Refresh
            </button>
            <button
              onClick={handleDeleteJob}
              disabled={deleting}
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 hover:border-red-400 disabled:opacity-50 rounded-lg text-red-300 hover:text-red-100 font-pixel text-[8px] uppercase transition-all"
            >
              {deleting ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="xl:col-span-2 space-y-6"
          >
            {/* Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">📊 Status</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Current:</span>
                  <div className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(job.status)}`}>
                    <span className="mr-2">{getStatusEmoji(job.status)}</span>
                    {job.status.replace(/_/g, ' ')}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300 text-sm">Progress:</span>
                    <span className="text-white font-bold">{job.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {job.userMessage && (
                  <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Message:</div>
                    <div className="text-white text-sm">{job.userMessage}</div>
                  </div>
                )}

                {job.retryCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 text-sm">Retries:</span>
                    <span className="text-orange-300 font-bold">{job.retryCount}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostic Panel */}
            <DiagnosticPanel job={job} />

            {/* Retry Status Card */}
            <RetryStatusCard job={job} />

            {/* Generated Content */}
            {(job.imageUrl || job.glbUrl) && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">🎨 Generated Content</h3>

                <div className="space-y-6">
                  {job.imageUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">Image</h4>
                        <a
                          href={job.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded text-cyan-300 hover:text-cyan-100 font-pixel text-[7px] uppercase transition-all"
                        >
                          View Full
                        </a>
                      </div>
                      <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                        <img
                          src={job.imageUrl}
                          alt="Generated monster"
                          className="w-full h-auto rounded-lg"
                        />
                      </div>
                      {job.imageS3Key && (
                        <div className="text-[10px] text-slate-500 mt-2 font-mono">
                          {job.imageS3Key}
                        </div>
                      )}
                    </div>
                  )}

                  {job.glbUrl && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wide">3D Model</h4>
                        <a
                          href={job.glbUrl}
                          download
                          className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded text-purple-300 hover:text-purple-100 font-pixel text-[7px] uppercase transition-all"
                        >
                          Download
                        </a>
                      </div>
                      <MonsterViewer
                        modelUrl={job.glbUrl}
                        height="h-96"
                        showControls={true}
                        autoRotate={true}
                        className="w-full"
                      />
                      <p className="text-slate-400 text-[10px] text-center mt-2">
                        ✨ Drag to rotate • Scroll to zoom
                      </p>
                      {job.glbS3Key && (
                        <div className="text-[10px] text-slate-500 mt-2 font-mono">
                          {job.glbS3Key}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Job Details */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">📝 Details</h3>

              <div className="space-y-4">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Prompt:</div>
                  <div className="text-white bg-slate-900/50 rounded-lg p-3 text-sm border border-slate-700/30">
                    {job.prompt}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Style:</div>
                    <div className="text-white capitalize">{job.style}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Stage:</div>
                    <div className="text-white capitalize">{job.stage}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Cost:</div>
                    <div className="text-white font-bold">${job.totalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase tracking-wide">Duration:</div>
                    <div className="text-white font-bold">{calculateJobDuration()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {(job.lastError || job.errorMessage) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
                <h3 className="font-pixel text-[10px] uppercase text-red-300 mb-4 tracking-wider">⚠️ Error Info</h3>

                {job.lastError && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-medium text-red-200 mb-1 uppercase">Type:</div>
                        <div className="text-red-100 text-sm">{job.lastError.type}</div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-red-200 mb-1 uppercase">Retryable:</div>
                        <div className="text-red-100 text-sm">{job.lastError.retryable ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-red-200 mb-1 uppercase">Message:</div>
                      <div className="text-red-100 bg-red-900/20 rounded-lg p-3 text-sm border border-red-500/20">
                        {job.lastError.userMessage}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-red-200 mb-1 uppercase">Technical:</div>
                      <div className="text-red-100 bg-red-900/20 rounded-lg p-3 font-mono text-xs border border-red-500/20">
                        {job.lastError.technicalMessage}
                      </div>
                    </div>
                  </div>
                )}

                {job.errorMessage && !job.lastError && (
                  <div>
                    <div className="text-xs font-medium text-red-200 mb-1 uppercase">Error:</div>
                    <div className="text-red-100 bg-red-900/20 rounded-lg p-3 font-mono text-sm border border-red-500/20">
                      {job.errorMessage}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* User Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">👤 User</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Name:</div>
                  <div className="text-white text-sm">{job.userName || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Email:</div>
                  <div className="text-white break-all text-sm">{job.userEmail || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">ID:</div>
                  <div className="text-slate-400 font-mono text-[10px] break-all">{job.userId}</div>
                </div>
                <Link
                  href={`/admin/users/${job.userId}`}
                  className="block w-full px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 hover:border-cyan-400 rounded-lg text-cyan-300 hover:text-cyan-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Timestamps */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">⏰ Times</h3>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Created:</div>
                  <div className="text-white text-xs">{formatDate(job.createdAt)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Updated:</div>
                  <div className="text-white text-xs">{formatDate(job.updatedAt)}</div>
                </div>
                {job.completedAt && (
                  <div>
                    <div className="text-xs font-medium text-slate-300 mb-1 uppercase">Completed:</div>
                    <div className="text-white text-xs">{formatDate(job.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
              <h3 className="font-pixel text-[10px] uppercase text-purple-300 mb-4 tracking-wider">⚡ Actions</h3>

              <div className="space-y-3">
                <Link
                  href={`/generate/${job.id}`}
                  target="_blank"
                  className="block w-full px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 hover:border-emerald-400 rounded-lg text-emerald-300 hover:text-emerald-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  Live Status
                </Link>
                <Link
                  href={`/admin/jobs?userId=${job.userId}`}
                  className="block w-full px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 hover:border-purple-400 rounded-lg text-purple-300 hover:text-purple-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  User Jobs
                </Link>
                <Link
                  href={`/admin/jobs?status=${job.status}`}
                  className="block w-full px-4 py-2 bg-orange-600/20 hover:bg-orange-600/40 border border-orange-500/50 hover:border-orange-400 rounded-lg text-orange-300 hover:text-orange-100 text-center font-pixel text-[8px] uppercase transition-all"
                >
                  Same Status
                </Link>
              </div>
            </div>

            {/* Manual Recovery Actions */}
            {job.status !== 'completed' && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
                <h3 className="font-pixel text-[10px] uppercase text-yellow-300 mb-4 tracking-wider">🔧 Recovery</h3>

                <div className="space-y-3">
                  <button
                    onClick={handleResetJob}
                    disabled={resetting}
                    className="block w-full px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500/50 hover:border-yellow-400 disabled:opacity-50 rounded-lg text-yellow-300 hover:text-yellow-100 text-center font-pixel text-[8px] uppercase transition-all"
                  >
                    {resetting ? 'Resetting...' : '🔄 Reset to Pending'}
                  </button>
                  <div className="text-xs text-slate-400 px-2">
                    {job.imageS3Key
                      ? 'Clears errors and resumes from 3D conversion (preserves image)'
                      : 'Clears errors and restarts from image generation'
                    }
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}