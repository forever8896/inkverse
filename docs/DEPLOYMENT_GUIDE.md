# Deployment Guide

Step-by-step guide for deploying Monsters Ink! to production. This covers all services and their configuration.

## Architecture Overview

```
Vercel (Next.js 15 + Vercel Workflows)
    ├── Neon PostgreSQL (database)
    ├── Cloudflare R2 (monster images + 3D models)
    ├── Pinata (IPFS NFT metadata)
    ├── OpenAI (image generation)
    ├── fal.ai (2D → 3D conversion)
    └── Railway (code validation server)
```

All services are stateless or managed. The main application runs on Vercel serverless functions. The code validation server runs as a Docker container on Railway.

---

## Prerequisites

- Node.js 20+
- npm 10+
- A GitHub account (for OAuth app creation)
- Accounts on: Vercel, Neon, Cloudflare, Pinata, OpenAI, fal.ai, Railway

---

## 1. Database — Neon PostgreSQL

1. Create a project at [neon.tech](https://neon.tech)
2. Create a database named `monsters`
3. Copy the **pooled** connection string (ends with `-pooler.*.neon.tech`)
4. Set `POSTGRES_URL` to this connection string (include `?sslmode=require`)
5. Run migrations:
   ```bash
   npm run db:migrate
   ```
   This runs all 18 migration files in `/migrations/` idempotently — safe to re-run.

**Configuration in code:** `src/lib/postgres.ts` auto-detects Vercel and adjusts pool settings (max 3 connections, 10s idle timeout, statement timeout 30s).

---

## 2. Storage — Cloudflare R2

1. Create an R2 bucket at [Cloudflare Dashboard](https://dash.cloudflare.com) → R2
2. Name the bucket (e.g., `monsters`)
3. Create an API token with read/write access to the bucket
4. Set these environment variables:
   ```
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY=<r2-access-key>
   S3_SECRET_KEY=<r2-secret-key>
   S3_BUCKET=monsters
   S3_REGION=auto
   ```

**For local development:** Use MinIO instead (`npm run storage:start` starts MinIO on port 9000 with default credentials `minioadmin/minioadmin`).

---

## 3. Authentication — GitHub OAuth

1. Create an OAuth App at [github.com/settings/developers](https://github.com/settings/developers)
2. Set the callback URL to `https://<your-domain>/api/auth/callback/github`
3. Set environment variables:
   ```
   GITHUB_CLIENT_ID=<client-id>
   GITHUB_CLIENT_SECRET=<client-secret>
   BETTER_AUTH_SECRET=<generate with: openssl rand -hex 32>
   ```

**Important:** The Better Auth configuration in `src/lib/auth.ts` must have `trustedOrigins` updated to include your production domain. See `CLAUDE.md` for the exact config — do not modify anything else in that file.

---

## 4. AI Services

### OpenAI (Image Generation)

1. Get an API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Set:
   ```
   OPENAI_API_KEY=sk-proj-...
   ```
3. Ensure your account has access to GPT-Image-1 (gpt-image-1)

**Cost:** ~$0.216 per 1024x1024 image generation (including tax estimate)

### fal.ai (2D → 3D Conversion)

1. Get an API key at [fal.ai/dashboard/keys](https://fal.ai/dashboard/keys)
2. Set:
   ```
   FAL_KEY=<your-fal-api-key>
   ```

**Cost:** ~$0.54 per 3D model conversion

---

## 5. NFT Infrastructure — Pinata + Polkadot AssetHub

### Pinata (IPFS)

1. Create an account at [pinata.cloud](https://app.pinata.cloud)
2. Create an API key with pinning permissions
3. Create a dedicated gateway
4. Set:
   ```
   PINATA_JWT=<jwt-token>
   PINATA_GATEWAY=<your-gateway>.mypinata.cloud
   PINATA_GATEWAY_KEY=<gateway-key>
   ```

### Polkadot AssetHub

1. Generate a platform account:
   ```bash
   npx ts-node scripts/generate-platform-account.ts
   ```
2. Create an NFT collection:
   ```bash
   npx ts-node scripts/create-collection-paseo.ts
   ```
3. Set:
   ```
   PLATFORM_ACCOUNT_SEED="<twelve word seed phrase>"
   NEXT_PUBLIC_PLATFORM_ADDRESS="<ss58 address>"
   NFTS_COLLECTION_ID=<collection-id>
   NEXT_PUBLIC_NFTS_COLLECTION_ID=<collection-id>
   ASSET_HUB_RPC_URL=wss://passet-hub-paseo.ibp.network
   ```

**Note:** For mainnet, change the RPC URL to a Polkadot AssetHub endpoint.

---

## 6. Code Validation Server — Railway

The code validation server compiles ink! smart contracts in a Docker container.

1. Deploy to Railway from the `code-validation-server/` directory
2. Railway will use the Dockerfile automatically
3. Set environment variables on Railway:
   ```
   API_KEY=<generate with: openssl rand -hex 32>
   REDIS_URL=<railway-provided-redis-url>
   PORT=3000
   WORKER_CONCURRENCY=2
   COMPILATION_TIMEOUT=120000
   ```
4. The health check endpoint is `GET /health`
5. Set these in the main app:
   ```
   CODE_CHECKER_API_KEY=<same API_KEY from above>
   CODE_CHECKER_URL=https://<your-railway-app>.up.railway.app
   ```

**Current production URL:** `https://monsters-code-validation-server-production.up.railway.app`

---

## 7. Main Application — Vercel

1. Import the repository on [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Build command is configured in `vercel.json`:
   ```json
   {
     "buildCommand": "npm run prebuild && npm run build",
     "installCommand": "npm install",
     "framework": "nextjs"
   }
   ```
4. Add all environment variables from sections 1–6 above
5. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
6. Deploy

### Vercel Workflows

The monster generation pipeline uses Vercel Workflows for durable execution. These are configured automatically via the `workflow` package and `src/workflows/` directory. No additional Vercel configuration is needed — workflows are detected at build time.

### Custom Domain (Optional)

If setting a custom domain, update:
- `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- `trustedOrigins` in `src/lib/auth.ts`
- GitHub OAuth callback URL

---

## 8. GitHub App — Lesson Editor (Optional)

The lesson editor can submit PRs via a GitHub App. This is admin-only functionality.

1. Create a GitHub App at [github.com/settings/apps/new](https://github.com/settings/apps/new)
2. Required permissions: Repository contents (read & write), Pull requests (read & write)
3. Install the app on the repository
4. Set:
   ```
   GITHUB_APP_ID=<app-id>
   GITHUB_APP_PRIVATE_KEY=<private-key>
   GITHUB_APP_INSTALLATION_ID=<installation-id>
   ```

---

## Environment Variable Reference

All variables are documented in `.env.example`. Copy it to `.env.local` for local development:

```bash
cp .env.example .env.local
```

For production, set all variables in the Vercel dashboard under Settings → Environment Variables.

### Auto-set by Vercel

These are set automatically and do not need manual configuration:
- `VERCEL` — Runtime detection
- `VERCEL_PROJECT_ID` / `VERCEL_TEAM_ID` — Used by workflow inspection tools
- `NODE_ENV` — Set to `production` automatically

---

## Post-Deployment Verification

1. **Health check:** `GET /api/health` — should return `{"status":"healthy"}`
2. **Admin dashboard:** Navigate to `/admin` — verify database, storage, and AI service status on the System Health page
3. **Auth flow:** Click "Sign in with GitHub" — should redirect and return
4. **Lesson navigation:** Open `/lesson/1/1/1` — should render lesson content
5. **Code compilation:** Attempt a code submission in a lesson step — should reach the validation server
6. **Monster generation:** Trigger a generation (costs ~$0.76) — verify workflow completes in admin dashboard

---

## Local Development Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start MinIO storage (separate terminal)
npm run storage:start

# Start dev server with workflow support
npm run dev:workflow

# Or without workflows (faster startup)
npm run dev
```

The app runs at `http://localhost:3004`.
