/**
 * GitHub App PR Service
 *
 * Creates pull requests to the inkverse repository using a GitHub App
 * installation token. Used by the lesson editor to submit lesson changes.
 */

import * as jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';
const REPO_OWNER = 'forever8896';
const REPO_NAME = 'inkverse';

interface GitHubRef {
  object: { sha: string };
}

interface GitHubContent {
  sha: string;
}

interface GitHubPR {
  number: number;
  html_url: string;
  head: { ref: string };
}

/**
 * Generate a short-lived installation token from GitHub App credentials.
 * Signs a JWT with the App private key, then exchanges it for an installation token (1hr TTL).
 */
async function generateInstallationToken(): Promise<string> {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;

  if (!appId || !privateKey || !installationId) {
    throw new Error('GITHUB_APP_NOT_CONFIGURED');
  }

  // The private key may be stored with escaped newlines in env vars
  const key = privateKey.replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iat: now - 60, // issued at (60s in the past to account for clock drift)
    exp: now + 600, // expires in 10 minutes
    iss: appId,
  };

  const appJwt = jwt.sign(payload, key, { algorithm: 'RS256' });

  const response = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    console.error('[GitHub PR] Failed to get installation token:', response.status, body);
    throw new Error(`Failed to get GitHub installation token: ${response.status}`);
  }

  const data = await response.json();
  return data.token;
}

/**
 * Fetch headers used for all GitHub API calls with an installation token.
 */
function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/**
 * Get the SHA of the HEAD of the main branch.
 */
async function getMainHeadSha(token: string): Promise<string> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/main`,
    { headers: authHeaders(token) }
  );

  if (!response.ok) {
    throw new Error(`Failed to get main branch HEAD: ${response.status}`);
  }

  const data: GitHubRef = await response.json();
  return data.object.sha;
}

/**
 * Create a new branch from a given SHA.
 */
async function createBranch(token: string, branchName: string, baseSha: string): Promise<void> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: baseSha,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create branch ${branchName}: ${response.status} ${body}`);
  }
}

/**
 * Get the SHA of an existing file in the repo (needed for updates).
 * Returns null if the file doesn't exist.
 */
async function getExistingFileSha(token: string, path: string, branch: string): Promise<string | null> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${branch}`,
    { headers: authHeaders(token) }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to check existing file: ${response.status}`);
  }

  const data: GitHubContent = await response.json();
  return data.sha;
}

/**
 * Create or update a file in the repo via the Contents API.
 */
async function commitLessonFile(
  token: string,
  branch: string,
  lessonId: number,
  content: string,
  existingFileSha?: string | null
): Promise<void> {
  const path = `src/content/lessons/${lessonId}.json`;
  const encodedContent = Buffer.from(content).toString('base64');

  const body: Record<string, unknown> = {
    message: `lesson-editor: update lesson ${lessonId}`,
    content: encodedContent,
    branch,
  };

  if (existingFileSha) {
    body.sha = existingFileSha;
  }

  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`,
    {
      method: 'PUT',
      headers: authHeaders(token),
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const respBody = await response.text();
    throw new Error(`Failed to commit lesson file: ${response.status} ${respBody}`);
  }
}

/**
 * Create a pull request from a branch to main.
 */
async function createPullRequest(
  token: string,
  branch: string,
  title: string,
  body: string
): Promise<{ number: number; html_url: string }> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({
        title,
        body,
        head: branch,
        base: 'main',
      }),
    }
  );

  if (!response.ok) {
    const respBody = await response.text();
    throw new Error(`Failed to create pull request: ${response.status} ${respBody}`);
  }

  const data: GitHubPR = await response.json();
  return { number: data.number, html_url: data.html_url };
}

/**
 * Check if an open PR already exists for a given branch.
 */
async function checkExistingPR(token: string, branch: string): Promise<GitHubPR | null> {
  const response = await fetch(
    `${GITHUB_API}/repos/${REPO_OWNER}/${REPO_NAME}/pulls?head=${REPO_OWNER}:${branch}&state=open`,
    { headers: authHeaders(token) }
  );

  if (!response.ok) {
    return null;
  }

  const data: GitHubPR[] = await response.json();
  return data.length > 0 ? data[0] : null;
}

/**
 * Orchestrator: validates, creates branch, commits file, and opens PR.
 */
export async function submitLessonPR(
  lessonId: number,
  lessonTitle: string,
  lessonJson: string,
  userId: string
): Promise<{ prUrl: string; prNumber: number }> {
  const token = await generateInstallationToken();

  const timestamp = Math.floor(Date.now() / 1000);
  const branchName = `lesson-editor/${lessonId}-${timestamp}`;

  // Check for existing open PR for this lesson (any branch prefix)
  // We search broadly — if the user already has an open PR we inform them
  const existingPR = await checkExistingPR(token, `lesson-editor/${lessonId}-`);
  if (existingPR) {
    const error = new Error('PR_ALREADY_EXISTS') as Error & { prUrl: string; prNumber: number };
    error.prUrl = existingPR.html_url;
    error.prNumber = existingPR.number;
    throw error;
  }

  // Get main HEAD and create branch
  const mainSha = await getMainHeadSha(token);
  await createBranch(token, branchName, mainSha);

  // Check if the lesson file already exists on main (for updates vs creates)
  const existingFileSha = await getExistingFileSha(token, `src/content/lessons/${lessonId}.json`, branchName);

  // Commit the lesson file
  await commitLessonFile(token, branchName, lessonId, lessonJson, existingFileSha);

  // Create the PR
  const prTitle = `lesson-editor: update "${lessonTitle}" (lesson ${lessonId})`;
  const prBody = [
    `## Lesson Editor Update`,
    ``,
    `- **Lesson**: ${lessonTitle} (ID: ${lessonId})`,
    `- **Submitted by**: user ${userId}`,
    `- **Branch**: \`${branchName}\``,
    ``,
    `### Changes`,
    `Updated \`src/content/lessons/${lessonId}.json\` via the lesson editor.`,
    ``,
    `---`,
    `*Submitted via Monsters Ink! Lesson Editor*`,
  ].join('\n');

  const pr = await createPullRequest(token, branchName, prTitle, prBody);

  return { prUrl: pr.html_url, prNumber: pr.number };
}
