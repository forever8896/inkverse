# Maintenance Guide

Operational runbooks for Monsters Ink! production. Covers common scenarios, troubleshooting, and routine maintenance.

---

## Service Health Overview

| Service | Health Check | Dashboard |
|---------|-------------|-----------|
| Main app (Vercel) | `GET /api/health` | Vercel Dashboard → Project |
| Admin dashboard | `/admin/system` | Shows DB, storage, AI, performance |
| Code validation (Railway) | `GET /health` on Railway URL | Railway Dashboard |
| Database (Neon) | Checked by `/api/health` | Neon Console |
| Storage (R2) | Checked by admin system health | Cloudflare Dashboard → R2 |

The admin dashboard at `/admin/system` gives a single-page view of all service statuses with auto-refresh (configurable: 10s, 30s, 1m, 5m).

---

## Runbook: AI Service Issues

### OpenAI Down or Rate Limited

**Symptoms:** Monster generation jobs stuck at `image_generation_retrying` status.

**What happens automatically:**
- The workflow classifies errors and retries with exponential backoff (see `src/lib/pipeline-errors.ts`)
- Rate limit errors (429) retry after 15 minutes
- Network errors retry after 1 minute
- Auth errors (401/403) fail immediately — no retry

**Manual intervention:**
1. Check job status in admin dashboard at `/admin/jobs`
2. Check OpenAI status at [status.openai.com](https://status.openai.com)
3. If persistent, check API key validity and quota at [platform.openai.com/usage](https://platform.openai.com/usage)
4. Jobs will auto-retry when service recovers — no action needed for transient outages

### fal.ai Down or Rate Limited

**Symptoms:** Jobs stuck at `conversion_retrying` status.

**What happens automatically:** Same retry logic as OpenAI — exponential backoff, error classification.

**Manual intervention:**
1. Check job status in admin dashboard
2. Check fal.ai status
3. Verify API key at [fal.ai/dashboard](https://fal.ai/dashboard)

### Cost Spike Detection

**Monitor:** Admin dashboard at `/admin/api-costs` and `/admin/system` → Usage Metrics

**Warning signs:**
- Abnormally high "Generations Today" count
- Cost today significantly exceeding average
- High retry rate (normal: ~30%, concerning: >50%)

**Action:**
- Check for stuck retry loops in `/admin/jobs` (filter by "retrying" status)
- Each successful generation costs ~$0.76 (OpenAI ~$0.22 + fal.ai ~$0.54)
- Failed generations that retry still incur costs per attempt

---

## Runbook: Database Issues

### Neon Connection Issues

**Symptoms:** `/api/health` returns `{"status":"unhealthy"}`, 500 errors across the app.

**Check:**
1. Neon Console → verify project is active (Neon auto-suspends idle databases on free tier)
2. Verify `POSTGRES_URL` in Vercel environment variables
3. Check connection pool status in admin system health page

**Configuration (in `src/lib/postgres.ts`):**
- Vercel: max 3 connections, 10s idle timeout, 30s statement timeout
- Development: max 10 connections, 30s idle timeout

### Database Migrations

Run migrations when deploying new code that changes the schema:

```bash
npm run db:migrate
```

Migrations are idempotent — safe to re-run. They handle "already exists" errors gracefully. All migration files are in `/migrations/` and run in order.

### Database Reset (Destructive)

Only use in development or if starting fresh:

```bash
npm run db:reset
npm run db:migrate
```

---

## Runbook: Code Validation Server (Railway)

### Server Unresponsive

**Symptoms:** Code compilation in lessons returns "service temporarily unavailable."

**Check:**
1. Railway Dashboard → check container status
2. Hit health endpoint directly: `GET https://<railway-url>/health`
3. Check Railway logs for crash loops

**Common causes:**
- Redis connection lost (check `REDIS_URL`)
- Out of memory during Rust compilation (Railway container limits)
- Container restart after deploy

**The main app handles this gracefully:** `src/app/api/compile/route.ts` detects 5xx and network errors, returns 503 with `serviceUnavailable: true` to the frontend. Users see a friendly "service temporarily unavailable" message.

### Compilation Timeouts

**Default timeout:** 120 seconds (`COMPILATION_TIMEOUT=120000`)

First-time compilations are slower due to Rust dependency resolution. The Dockerfile pre-warms the cargo cache with a minimal contract to reduce cold-start times.

### Rate Limits

- General: 100 requests/minute per IP
- Compilation: 10 requests/minute per IP

Configured in `code-validation-server/src/api/middleware/rateLimit.ts`. Adjust via environment variables: `RATE_LIMIT_MAX_REQUESTS`, `COMPILE_RATE_LIMIT_MAX`.

---

## Runbook: Storage (Cloudflare R2)

### Presigned URL Expiry

Monster images and 3D models are served via presigned S3 URLs that expire after 2 hours. The status endpoint (`/api/monster-status/[jobId]`) auto-refreshes URLs older than 1 hour.

**If users report broken monster images:** The presigned URL likely expired. Refreshing the page or re-fetching the monster status will generate new URLs.

### Storage Connectivity

Checked by the admin system health endpoint. If R2 is unreachable:
1. Verify credentials in Vercel environment variables
2. Check Cloudflare R2 dashboard for bucket status
3. Verify `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET`

---

## Runbook: Authentication

### GitHub OAuth Issues

**Symptoms:** Users can't sign in, callback errors.

**Check:**
1. GitHub OAuth App settings — verify callback URL matches production domain
2. `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Vercel env vars
3. `trustedOrigins` in `src/lib/auth.ts` includes the production domain

**Important:** Do not modify any other part of the auth configuration in `src/lib/auth.ts`. See `CLAUDE.md` for details on why.

### Session Issues

Sessions last 7 days, with cookie cache of 5 minutes. If users report being logged out unexpectedly:
1. Check database connectivity (sessions are stored in PostgreSQL)
2. Verify `BETTER_AUTH_SECRET` hasn't changed (changing it invalidates all sessions)

---

## Runbook: IPFS / NFT Issues

### IPFS Gateway Failures

The app tries 4 IPFS gateways in order (see `src/lib/ipfs-utils.ts`):
1. Pinata (authenticated, fastest)
2. Cloudflare
3. ipfs.io (official)
4. dweb.link

If all 4 fail, the operation fails. Check Pinata dashboard for API key validity and gateway status.

### NFT Minting Failures

Pre-flight checks run before minting (`src/workflows/steps/check-nft-prerequisites.ts`):
- IPFS connectivity
- AssetHub RPC connectivity
- Platform account balance

**If minting fails:**
1. Check platform wallet balance — needs enough for transaction fees
2. Verify `ASSET_HUB_RPC_URL` is accessible
3. Check `PLATFORM_ACCOUNT_SEED` is correct

---

## Routine Maintenance

### Monitoring Checklist (Weekly)

- [ ] Check admin dashboard `/admin/system` — all services green
- [ ] Review `/admin/api-costs` — costs within expected range
- [ ] Check `/admin/jobs` for stuck or failed jobs
- [ ] Review Railway logs for code validation server errors

### API Key Rotation

When rotating keys, update in Vercel environment variables and redeploy:

| Key | Where to regenerate |
|-----|---------------------|
| `OPENAI_API_KEY` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `FAL_KEY` | [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys) |
| `CODE_CHECKER_API_KEY` | Generate new: `openssl rand -hex 32`, update both Vercel and Railway |
| `GITHUB_CLIENT_SECRET` | [github.com/settings/developers](https://github.com/settings/developers) |
| `BETTER_AUTH_SECRET` | Generate new: `openssl rand -hex 32` — **invalidates all sessions** |
| `PINATA_JWT` | [app.pinata.cloud/developers/api-keys](https://app.pinata.cloud/developers/api-keys) |

### Dependency Updates

```bash
npm outdated          # Check for outdated packages
npm update            # Update within semver ranges
npm audit             # Check for security vulnerabilities
```

Key dependencies to watch:
- `next` — framework updates
- `workflow` — Vercel Workflows (currently beta)
- `@polkadot/*` — blockchain SDK updates
- `better-auth` — authentication library

### Log Access

- **Vercel logs:** Vercel Dashboard → Project → Logs (real-time and historic)
- **Railway logs:** Railway Dashboard → Service → Logs
- **Application logs:** JSON-formatted in production (`src/lib/logger.ts`), filterable by log level
- **Workflow logs:** `npm run workflow:web` opens the Vercel Workflow inspector

---

## Emergency Procedures

### Maintenance Mode

Enable via admin settings at `/admin/settings`:
- Toggles maintenance mode with a custom message
- Blocks new generation jobs while existing ones complete

### Kill Stuck Jobs

In the admin dashboard at `/admin/jobs`:
1. Filter by status (retrying, generating, converting)
2. Individual jobs can be deleted
3. Check workflow status for each job

### Full Service Recovery

If multiple services are down:
1. Check Vercel status at [vercel.com/status](https://vercel.com/status)
2. Verify database at Neon Console
3. Verify storage at Cloudflare Dashboard
4. Check Railway for code validation server
5. The `/api/health` endpoint gives a quick overall status
6. The admin system health page (`/admin/system`) gives detailed per-service status
