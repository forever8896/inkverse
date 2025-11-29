/**
 * Workflow utilities for admin interface
 */

/**
 * Construct Workflow Inspector URL
 * Vercel Workflow Inspector URL format:
 * https://vercel.com/<team>/<project>/workflows/runs/<runId>
 */
export function getWorkflowInspectorUrl(runId: string): string {
  // Try environment variables first
  const team =
    process.env.NEXT_PUBLIC_VERCEL_TEAM_ID ||
    process.env.VERCEL_TEAM_ID;

  const project =
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_ID ||
    process.env.VERCEL_PROJECT_ID ||
    'monsters-prod';

  if (!team) {
    // Fallback to generic Vercel dashboard if team ID not set
    return 'https://vercel.com/dashboard';
  }

  return `https://vercel.com/${team}/${project}/workflows/runs/${runId}`;
}
