/**
 * Workflow Data Utilities
 *
 * Server-side utilities for fetching Vercel Workflow run data, steps, and events.
 * These functions provide observability into durable workflow execution for admin monitoring.
 *
 * CRITICAL: This implementation follows the actual Vercel Workflow API surface.
 * - Import getRun from 'workflow/api'
 * - Import getWorld from 'workflow/runtime' (NOT 'workflow/api')
 * - All Run properties are async getters (must await)
 * - Steps/events accessed via World.storage API, not run.steps/run.events
 *
 * @module lib/workflow-data
 */

import type { WorkflowRun, Step, Event } from '@workflow/world';

/**
 * Workflow run status enumeration
 */
export type WorkflowRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'cancelled';

/**
 * Enriched workflow run data with steps, events, and computed metadata
 */
export interface EnrichedWorkflowRun {
  /** Unique workflow run identifier */
  runId: string;
  /** Current workflow execution status */
  status: WorkflowRunStatus;
  /** Workflow function name */
  workflowName: string;
  /** Workflow error message (only present on failure) */
  error?: string;
  /** Workflow error code (only present on failure) */
  errorCode?: string;
  /** Timestamp when workflow execution started */
  startedAt?: Date;
  /** Timestamp when workflow execution completed */
  completedAt?: Date;
  /** Timestamp when workflow run was created */
  createdAt: Date;
  /** Timestamp of last workflow update */
  updatedAt: Date;
  /** Array of workflow steps with execution details */
  steps: Step[];
  /** Array of workflow events (lifecycle and custom) */
  events: Event[];
  /** Currently executing step (if any) */
  currentStep?: Step;
  /** Total workflow duration in milliseconds (if completed) */
  duration?: number;
}

/**
 * Lightweight workflow status response (no steps/events)
 */
export interface WorkflowStatus {
  /** Current workflow execution status */
  status: WorkflowRunStatus;
  /** Name of currently executing step */
  currentStepName?: string;
}

/**
 * Fetch complete workflow run data including steps and events.
 *
 * This is the ONLY correct way to retrieve workflow observability data.
 * Uses the World Storage API to access steps/events, as they are not
 * directly exposed on the Run class.
 *
 * @param runId - Workflow run identifier (format: wfr_...)
 * @returns Enriched workflow data or null if not found/expired
 *
 * @example
 * ```typescript
 * const workflowData = await getWorkflowRunData('wfr_abc123');
 * if (workflowData) {
 *   console.log(`Workflow ${workflowData.workflowName} is ${workflowData.status}`);
 *   console.log(`Steps completed: ${workflowData.steps.filter(s => s.status === 'completed').length}`);
 * }
 * ```
 */
export async function getWorkflowRunData(
  runId: string
): Promise<EnrichedWorkflowRun | null> {
  try {
    // Dynamic import to avoid bundling server-only code in client bundles
    const { getWorld } = await import('workflow/runtime');
    const world = getWorld();

    // Get underlying WorkflowRun object (has error/errorCode fields)
    // This is the source of truth for workflow-level metadata
    const workflowRun: WorkflowRun = await world.runs.get(runId);

    // Get all steps for this workflow run (paginated)
    // Limit: 100 steps should be sufficient for most workflows
    // TODO: Implement pagination if workflows exceed 100 steps
    const stepsResponse = await world.steps.list({
      runId,
      pagination: { limit: 100 }
    });

    // Get all events for this workflow run (paginated)
    // Limit: 100 events should be sufficient for Phase 1
    // TODO: Implement pagination if event logs grow large
    const eventsResponse = await world.events.list({
      runId,
      pagination: { limit: 100 }
    });

    const steps = stepsResponse.data || [];
    const events = eventsResponse.data || [];

    // Find currently executing step (if any)
    const currentStep = steps.find(s => s.status === 'running');

    // Calculate total workflow duration (if completed)
    const duration = workflowRun.completedAt && workflowRun.startedAt
      ? workflowRun.completedAt.getTime() - workflowRun.startedAt.getTime()
      : undefined;

    return {
      runId: workflowRun.runId,
      status: workflowRun.status,
      workflowName: workflowRun.workflowName,
      error: workflowRun.error?.message,
      errorCode: workflowRun.error?.code,
      startedAt: workflowRun.startedAt,
      completedAt: workflowRun.completedAt,
      createdAt: workflowRun.createdAt,
      updatedAt: workflowRun.updatedAt,
      steps,
      events,
      currentStep,
      duration,
    };

  } catch (error) {
    // Workflow run not found, expired, or API error
    // This is expected for legacy jobs created before workflow integration
    console.error(`[workflow-data] Failed to fetch workflow data for ${runId}:`, error);
    return null;
  }
}

/**
 * Fetch lightweight workflow status without steps/events.
 *
 * Optimized for jobs list views where full step/event data is unnecessary.
 * Only retrieves workflow status and current step name for display.
 *
 * @param runId - Workflow run identifier (format: wfr_...)
 * @returns Workflow status and current step, or null if not found
 *
 * @example
 * ```typescript
 * const status = await getWorkflowStatus('wfr_abc123');
 * if (status) {
 *   console.log(`Status: ${status.status}, Current Step: ${status.currentStepName || 'None'}`);
 * }
 * ```
 */
export async function getWorkflowStatus(
  runId: string
): Promise<WorkflowStatus | null> {
  try {
    // Dynamic import to avoid bundling server-only code in client bundles
    const { getWorld } = await import('workflow/runtime');
    const world = getWorld();

    // Get workflow metadata
    const workflowRun: WorkflowRun = await world.runs.get(runId);

    // Fetch only recent steps to find currently executing step
    // Limit: 10 steps is sufficient to find running step
    const stepsResponse = await world.steps.list({
      runId,
      pagination: { limit: 10 }
    });

    // Find the currently executing step (if any)
    const runningStep = stepsResponse.data?.find(s => s.status === 'running');

    return {
      status: workflowRun.status,
      currentStepName: runningStep?.stepName,
    };

  } catch (error) {
    // Workflow run not found, expired, or API error
    console.error(`[workflow-data] Failed to fetch workflow status for ${runId}:`, error);
    return null;
  }
}
