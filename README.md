# Monsters Ink!

Create an adorable creature by learning Polkadot and Ink!

Goal: Make Polkadot fun ~~again

## ⚡ Quick Start

```bash
# 1. Install PostgreSQL and create 'monsters' database
# 2. Copy environment template
cp .env.example .env.local

# 3. Configure .env.local with your credentials
# 4. Generate Better Auth secret: openssl rand -hex 32

# 5. Install, migrate, and run
npm install
npm run db:migrate
vercel dev --listen 3004 --yes  # Use this for workflow testing
```

Visit **http://localhost:3004**

## 🛠️ Local Development Setup

### 🔑 Authentication System

Monsters Ink! uses [Better Auth](https://www.better-auth.com) for authentication with GitHub OAuth integration.

**Why GitHub OAuth?**
Because AI-powered 3D monster generation is expensive (~$2 per user journey), we require GitHub authentication to prevent abuse and botting. As outlined in our grant application, users must authenticate with a GitHub account that has at least one public repository before accessing AI generation features. This ensures the platform serves legitimate developers while protecting our operational budget.

**Generate Auth Secret:**

```bash
# Generate a secure random secret for BETTER_AUTH_SECRET
openssl rand -hex 32
```

Add the generated secret to your `.env.local`:

```bash
BETTER_AUTH_SECRET=your_generated_secret_here
```

**Database Schema:**
Better Auth tables (`user`, `session`, `account`, `verification`) are included in our migration files. Run `npm run db:migrate` to create them.

**GitHub OAuth Setup:**

1. Create a GitHub OAuth app at https://github.com/settings/developers
2. Set Authorization callback URL to: `http://localhost:3004/api/auth/callback/github`
3. Add credentials to `.env.local`:
   ```bash
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

Authentication is configured in `/src/lib/auth.ts` and requires no additional setup.

---

### 🗄️ Prerequisites

1. **PostgreSQL** - Install PostgreSQL locally:

   ```bash
   # macOS (via Homebrew)
   brew install postgresql@16
   brew services start postgresql@16

   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql

   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database**:

   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create database
   CREATE DATABASE monsters;

   # Exit psql
   \q
   ```

3. **Environment Variables**:
   Copy `.env.example` to `.env.local` and configure:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your credentials:

   ```bash
   # Database
   POSTGRES_URL="postgresql://your_username:your_password@localhost:5432/monsters"

   # GitHub OAuth (get from https://github.com/settings/developers)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret

   # Better Auth Secret (generate with: openssl rand -hex 32)
   BETTER_AUTH_SECRET=your_random_secret_here

   # AI Services (optional for basic development)
   OPENAI_API_KEY=your_openai_key
   FAL_KEY=your_fal_key

   # S3/MinIO Storage (optional for basic development)
   S3_ENDPOINT=http://localhost:9000
   S3_ACCESS_KEY=minioadmin
   S3_SECRET_KEY=minioadmin
   S3_BUCKET=monsters-dev
   S3_REGION=us-east-1
   ```

4. **Run Database Migrations**:
   ```bash
   npm install
   npm run db:migrate
   ```

### 💻 Development Commands

```bash
# Database
npm run db:migrate    # Run all database migrations
npm run db:reset      # ⚠️  Drop all tables and re-run migrations (destructive!)
npm run db:setup      # Alias for db:migrate

# Development
vercel dev --listen 3004 --yes  # Start development server with Vercel Workflows (REQUIRED for workflow testing)
npm run dev                      # Alternative: Start Next.js dev server (workflows may not work locally)
npm run build                    # Build for production
npm start                        # Start production server

# Code Quality
npm run lint          # Run ESLint
npm run typecheck     # TypeScript type checking
npm run format        # Format code with Prettier

# Testing
npm test              # Run all unit tests
npm test -- --ui      # Run tests with interactive UI
npm test -- --watch   # Run tests in watch mode
npm test -- --coverage # Run tests with coverage report

# Storage (needed to generate images)
npm run storage:start # Start local MinIO server for S3-compatible storage
```

## 🧠 AI Generation Pipeline Safeguards

The monster pipeline runs in three stages—prompt → OpenAI image → fal.ai 3D model—with every output persisted to S3 so we never redo completed work. When the status endpoint is polled the API starts background processing and supervises retryable failures.

- **OpenAI failures:** Rate limits, transient network errors, and 5xx responses retry automatically with staged delays (30s baseline, up to five attempts). Content-policy rejections stop immediately so creators can adjust their prompt, while invalid API keys or exhausted credits are marked non-retryable and surface clear operator messages.
- **S3 availability:** Upload/download issues—including a missing local MinIO instance—raise `s3_upload_error`, attempt up to five retries with spacing, and block downstream steps so we do not pay for 3D conversion without storage.
- **fal.ai failures:** Busy queues and network hiccups retry with longer delays (60–120s, up to ten attempts). Invalid credentials or depleted credits halt the job, prompting human intervention instead of looping.

Each retry stores structured metadata (`retryCount`, `lastRetryAt`, `suggestedRetryDelay`), and the status endpoint now honors those delays so we never tight-loop expensive generations. A safety watchdog only resets stuck jobs after twice the planned delay (minimum two minutes) to recover from crashed workers without spamming providers.

## 🏗️ Architecture Overview

### Deployment

- **Platform:** Vercel serverless functions
- **Architecture:** Stateless, auto-scaling serverless functions
- **Storage:** PostgreSQL + S3/MinIO for files
- **Performance Focus:** Cold start optimization, bundle size, database efficiency

### Technology Stack

- **Smart Contracts:** ink! v6
- **Frontend:** React/Next.js 15 with Turbopack and Three.js for 3D visualization
- **Code Editor:** Monaco Editor (ink!/Rust syntax)
- **Backend:** Next.js API routes (Vercel serverless)
- **Workflows:** Vercel Workflows for durable task execution
- **Database:** PostgreSQL with connection pooling
- **Authentication:** GitHub OAuth integration via Better Auth
- **Infrastructure:** Docker containers for pop-cli compilation service
- **AI Pipeline:** OpenAI GPT-Image-1, fal.ai image-to-3D, OpenAI content moderation
- **Styling:** Tailwind CSS v4
- **Animation:** Motion library (Framer Motion successor)

## 🎨 Monster Generation Flow

Monster generation is triggered automatically when users complete specific lesson milestones.

1.  **Trigger:** Completion of a lesson stage sends a structured `GenerateMonsterRequest` (defining physical traits, personality, etc.) to the API.
2.  **Prompt Engineering:** The API uses `generatePromptFromStructuredData` to securely construct a detailed, optimized AI prompt server-side.
3.  **Pipeline Execution:** A durable Vercel Workflow is initiated:
    *   **2D Generation:** OpenAI's GPT-Image-1 creates a base 2D sprite from the prompt.
    *   **3D Conversion:** If requested, fal.ai converts the 2D sprite into a `.glb` 3D model.
    *   **Asset Storage:** All assets are persisted to S3/MinIO to prevent redundant generation.

## 📝 Notes

- Desktop/laptop/iPad browsers only (mobile not supported for optimal learning experience)
- npx --yes @polkadot-api/cli Might have to get run in order for the app to compile correctly, to investigate.
