# Handover Document — Monsters Ink!

Everything the ink! team needs to take over long-term ownership and maintenance of the Monsters Ink! platform.

---

## What You're Receiving

Monsters Ink! is a fully deployed, production-ready educational platform that teaches ink! smart contract development through an interactive creature evolution experience. Users progress through lessons, write real ink! code that compiles against cargo-contract, and evolve AI-generated 3D monster NFTs.

**Production URL:** `https://monsters-prod.vercel.app`
**Repository:** `github.com/forever8896/inkverse`

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (Turbopack) | Server-rendered React application |
| Language | TypeScript | Full codebase |
| Styling | Tailwind CSS v4 | Utility-first styling |
| Animation | Motion (Framer Motion successor) | UI animations |
| Code editor | Monaco Editor | Browser-based ink!/Rust editor |
| 3D rendering | Three.js + React Three Fiber | Monster model display |
| Auth | Better Auth + GitHub OAuth | Session management |
| Database | PostgreSQL (Neon) | Users, sessions, progress, jobs |
| Storage | Cloudflare R2 (S3-compatible) | Monster images and 3D models |
| AI — Images | OpenAI GPT-Image-1 | 2D monster sprite generation |
| AI — 3D | fal.ai | Image-to-3D model conversion |
| NFT metadata | Pinata (IPFS) | Decentralized metadata storage |
| Blockchain | Polkadot AssetHub | NFT minting |
| Code validation | Express + BullMQ + cargo-contract | ink! contract compilation |
| Orchestration | Vercel Workflows | Durable AI pipeline execution |
| Hosting | Vercel (main) + Railway (validation) | Serverless + Docker |

---

## Repository Structure

```
/
├── src/
│   ├── app/                    # Next.js pages and API routes
│   │   ├── admin/              # Admin dashboard (6 pages)
│   │   ├── api/                # API endpoints
│   │   ├── gallery/            # Monster gallery
│   │   ├── lab/                # Lesson selection
│   │   └── lesson/             # Lesson pages [lessonId]/[chapterId]/[stepId]
│   ├── components/             # React components
│   │   ├── admin/              # Admin UI components
│   │   ├── gallery/            # Gallery components
│   │   └── lesson/             # Lesson UI components
│   ├── content/lessons/        # Lesson JSON files (educational content)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Shared utilities and services
│   ├── services/               # External service integrations (OpenAI, fal.ai, S3)
│   ├── styles/                 # Global CSS
│   ├── types/                  # TypeScript type definitions
│   └── workflows/              # Vercel Workflow definitions (AI pipeline)
├── code-validation-server/     # Dockerized ink! compiler service
├── docs/                       # Documentation
├── migrations/                 # Database migration SQL files
├── public/                     # Static assets (creatures, sounds)
└── scripts/                    # Utility scripts (DB, NFT, account generation)
```

---

## Key Systems

### 1. Lesson System

Lessons are defined as JSON files in `src/content/lessons/`. Each lesson contains chapters, and each chapter contains steps. Steps can include:
- Instructional content (HTML)
- Code exercises with validation rules
- Hints
- Authentication gates
- Monster evolution triggers

**To add or modify lessons:** See `docs/CONTRIBUTING_LESSONS.md` and `docs/LESSON_CONTENT_GUIDE.md`.

The platform also includes a graphical **Lesson Editor** at `/admin/editor` that can export JSON and submit PRs via a GitHub App.

### 2. Monster Generation Pipeline

The AI pipeline runs as a Vercel Workflow (durable execution):

1. User requests generation → API creates `pending` job in database
2. **Check storage** — verifies R2 bucket is accessible
3. **Generate image** — OpenAI creates a 2D monster sprite
4. **Convert to 3D** — fal.ai transforms 2D image into a .glb 3D model
5. **Completion** — updates database, stores assets in R2

Each step is idempotent and retryable. The workflow handles failures with exponential backoff and error classification (31 error types). See `docs/WORKFLOW.md` for full architecture.

**Cost per generation:** ~$0.76 (OpenAI ~$0.22 + fal.ai ~$0.54)

### 3. Code Validation

User-submitted ink! code is compiled by a Dockerized service running on Railway:
- Express.js server with BullMQ job queue
- Rust toolchain with cargo-contract v6
- Redis for queue persistence
- Rate limited (10 compilations/min per IP)
- Health check at `GET /health`

See `code-validation-server/` for the full implementation.

### 4. NFT Minting

After completing lesson 1, users can mint their monster as an NFT on Polkadot AssetHub:
- Metadata uploaded to IPFS via Pinata
- NFT minted on AssetHub using the platform wallet
- One NFT per GitHub account (enforced by database + on-chain checks)
- Monster images update as users progress through lessons

### 5. Admin Dashboard

Accessible at `/admin` (requires admin role in database). Includes:
- **Overview** — KPIs, costs, recent activity
- **Users** — Paginated list with search, sort, and per-user detail
- **Jobs** — Real-time monitoring with status filters and cost tracking
- **System Health** — Database, storage, AI service status with auto-refresh
- **API Costs** — Temporal pricing configuration per provider
- **Settings** — Job limits, timeouts, maintenance mode

---

## Deployed Services

| Service | Platform | URL |
|---------|----------|-----|
| Main application | Vercel | `https://monsters-prod.vercel.app` |
| Code validation | Railway | `https://monsters-code-validation-server-production.up.railway.app` |
| Database | Neon | Managed PostgreSQL (connection string in Vercel env vars) |
| Storage | Cloudflare R2 | S3-compatible bucket `monsters` |
| IPFS | Pinata | Dedicated gateway |
| Blockchain | Polkadot AssetHub | Paseo testnet via public RPC |

---

## Ongoing Operational Costs

### Per-User Costs (AI Generation)
- 2 generation stages per user journey (young monster + adult monster)
- ~$0.76 per successful generation
- ~30% failure/retry rate → ~$1.97 per complete user journey
- Budget: $2,000 AI credits supports ~1,015 complete user journeys

### Monthly Infrastructure Costs
- **Vercel:** Free tier or Pro ($20/mo) depending on traffic
- **Neon:** Free tier for low traffic, Pro for higher connection limits
- **Railway:** Usage-based pricing for code validation Docker container
- **Cloudflare R2:** First 10GB free, then $0.015/GB/month
- **Pinata:** Free tier includes 100 files, paid plans for more NFTs

The admin dashboard at `/admin/api-costs` tracks AI generation costs in real time.

---

## Common Operations

### Deploy a New Version

Push to the main branch. Vercel auto-deploys.

### Run Database Migrations

```bash
npm run db:migrate
```

### Add an Admin User

Set the `role` column to `admin` in the `user` table for the target user:

```sql
UPDATE "user" SET role = 'admin' WHERE email = 'user@example.com';
```

### Monitor System Health

- Quick: `GET /api/health`
- Detailed: Admin dashboard → System Health (`/admin/system`)

### Inspect Workflow Runs

```bash
npm run workflow:web
```

Opens the Vercel Workflow inspector showing all generation jobs, their steps, and status.

---

## Documentation Index

| Document | Path | Purpose |
|----------|------|---------|
| This handover | `docs/HANDOVER.md` | Overview for new maintainers |
| Deployment guide | `docs/DEPLOYMENT_GUIDE.md` | Step-by-step deployment |
| Maintenance guide | `docs/MAINTENANCE_GUIDE.md` | Runbooks and troubleshooting |
| Workflow architecture | `docs/WORKFLOW.md` | AI pipeline internals |
| Asset Pipeline API | `docs/ASSET_PIPELINE_API.md` | API endpoint reference |
| Progress API | `docs/PROGRESS_API_GUIDE.md` | Lesson progress tracking |
| Contributing lessons | `docs/CONTRIBUTING_LESSONS.md` | How to add lesson content |
| Lesson content guide | `docs/LESSON_CONTENT_GUIDE.md` | HTML/component reference for lessons |
| Monster generation guide | `docs/GENERATE_MONSTERS_GUIDE.md` | Generation pipeline operations |
| Implementation guide | `docs/IMPLEMENTATION_GUIDE.md` | Contract evolution system |
| API schema changes | `docs/API_SCHEMA_CHANGES.md` | Type system and database schema |
| Hooks & components | `src/hooks/README.md` | Monster generation React hooks |
| Environment template | `.env.example` | All environment variables |

---

## Security Model

- **GitHub OAuth** required at lesson 1, step 3 (before any AI generation)
- **Repository verification** — users must have at least 1 public GitHub repo
- **One account = one NFT** — enforced by database and on-chain checks
- **Content moderation** — all AI-generated images pass through OpenAI moderation API
- **Rate limiting** — API routes (2 active jobs/user), code validation (10 compile/min)
- **Input safety** — user customization limited to predefined options, no free-text prompts
- **Docker isolation** — code compilation runs in isolated container

---

## Known Constraints

1. **Vercel serverless** — functions are stateless, destroyed after each request. No persistent memory or in-memory caching across requests.
2. **AI service dependency** — the platform relies on OpenAI and fal.ai availability. Both have automatic retry logic with exponential backoff.
3. **Desktop only** — the UI is designed for desktop/laptop/tablet browsers, not mobile. This is a deliberate design decision documented in the grant application.
4. **Paseo testnet** — NFTs currently mint on Paseo testnet. Mainnet deployment requires changing `ASSET_HUB_RPC_URL` and ensuring the platform wallet has sufficient funds.

---

## Support & Contact

- **Owen Barnes** — Frontend, UI/UX, AI pipeline, 3D graphics — owen@owenbarnes.com
- **Kilián Valdman** — Backend, smart contracts, code validation, Docker — github.com/forever8896
