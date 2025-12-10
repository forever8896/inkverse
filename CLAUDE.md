# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Monsters Ink!** is an interactive learning platform that teaches Polkadot and ink! smart contract development through creature creation. Users progress through lessons and chapters by writing ink! contract code that brings digital creatures to life.

**🚀 Deployment Context: Vercel Serverless Functions**

This application is deployed on **Vercel serverless functions**, which significantly impacts architecture decisions:

- **Stateless execution**: Functions destroyed after each request, no persistent memory
- **No traditional caching**: Redis/in-memory caches are not beneficial (functions restart fresh)
- **No long-running processes**: Each API call gets isolated function instance
- **Database connections**: Pooled but each function connects independently
- **File storage**: Uses S3/MinIO, not local filesystem (except temp files)

## Project Status & Code Quality Standards

- **Stability**: Robust error handling, proper state management, comprehensive testing
- **Maintainability**: Clean architecture, proper separation of concerns, readable code
- **Extensibility**: Well-defined interfaces, modular design, plugin architecture for content
- **Documentation**: Comprehensive code documentation, API documentation, contributor guides
- **Open Source Standards**: Clear contribution guidelines, consistent code style, proper licensing
- **Security**: GitHub OAuth anti-farming protection, content moderation via OpenAI API, secure Docker compilation

**Development Approach:**

- Refactor any quick fixes into proper, tested solutions
- Add comprehensive TypeScript types and interfaces
- Implement proper error boundaries and loading states
- Add unit tests and integration tests for all components
- Create proper data validation and sanitization
- Establish consistent coding patterns and architectural decisions
- Implement production-grade error handling and monitoring

## Architecture

### Core Application Structure

The app uses Next.js 15 with React Server Components and implements a **Contract Evolution System** where students progressively build and enhance a single ink! smart contract throughout their learning journey:

1. **Lessons** (`/src/lib/lessons.ts`) - Progressive ink! tutorials with contract evolution
2. **Contract Evolution** (`/src/lib/contract-evolution.ts`) - System for building contracts across lessons

### Key Components

- **MonacoCodeEditor** (`/src/components/MonacoCodeEditor.tsx`) - Monaco-based editor for ink! smart contracts
- **LessonLayout** (`/src/components/LessonLayout.tsx`) - Main layout wrapper for lessons with integrated creature display
- **LabClient** (`/src/components/LabClient.tsx`) - Landing page component showing lesson selection

### Content Structure

- `/src/app/lesson/[lessonId]/[chapterId]/[stepId]/` - Lesson pages with deep linking to chapters/steps
- `/src/app/lab/` - Landing page for lesson selection
- `/public/creatures/` - Creature artwork and animations with evolution stages (PNG/WebM formats)
- `/src/content/lessons/` - JSON lesson definitions with evolution metadata
- `/src/lib/contract-templates.ts` - Contract templates for each evolution stage
- `/docs/` - Comprehensive documentation for the contract evolution system

## Technology Stack

### Current Implementation

- **Framework**: Next.js 15 with Turbopack
- **Styling**: Tailwind CSS v4
- **Animation**: Motion library (Framer Motion successor)
- **Language**: TypeScript
- **Code Editor**: Monaco Editor (for ink!/Rust syntax)

## Content Focus

### Educational Philosophy - Contract Evolution System

The application teaches ink! smart contract development through a **progressive contract evolution approach**:

**Core Learning Path:**
- **Lesson 1**: "The Egg Awakens" - Basic contract structure, storage, and simple functions
- **Lesson 2**: "The Creature Emerges" - Monster identity, events, error handling, testing
- **Lesson 3**: "The Monster Communicates" - Advanced events and error patterns
- **Lesson 4**: "The Monster Learns" - Data structures, mappings, and storage optimization
- **Lesson 5**: "The Monster Gets a Companion" - Cross-contract calls and trait definitions

**Key Principles:**
- **Contract Continuity**: Each lesson builds the same contract, adding complexity progressively
- **Visual Evolution**: Contract growth corresponds to creature visual evolution
- **Real-world Patterns**: All concepts apply to production ink! development
- **Emotional Investment**: Students develop attachment to their evolving creature

Educational content is structured as a gamified bio-engineering experience where students evolve both their ink! skills and their digital creature through writing working smart contracts.

## Security & Anti-Abuse Measures

- **GitHub OAuth**: Required at stage 3 of lesson 1 (before AI generation)
- **Repository Verification**: Users must have at least one public repository
- **One Account = One NFT**: Database and on-chain verification
- **Content Moderation**: All AI-generated images pass through OpenAI's moderation API
- **Rate Limiting**: Protection against DDoS and resource abuse
- **Docker Isolation**: Secure compilation environment for user code

## Cost Management

### Optimization Strategies - Contract Evolution

- **Strategic AI Generation**: Only trigger expensive generation at major evolution milestones
- **Evolution Stages**: Egg → Creature → Monster → Communicator → Intelligent → Social
- **30% failure rate buffer** for retries at generation points
- **Caching for common patterns**: Reusable contract templates and visual assets
- **Progressive loading**: Minimize API calls through smart evolution triggers
- **Cost estimation**: Clear cost warnings before AI generation steps

## Development Guidelines

### Code Style

- Use existing patterns and conventions in the codebase
- Maintain TypeScript strict mode compliance
- Follow React Server Components best practices
- Implement comprehensive error boundaries

### Testing Requirements

- Unit tests for all utility functions
- Integration tests for lesson validation
- E2E tests for critical user flows

### Documentation Standards

- Inline comments for complex logic
- JSDoc for all exported functions
- README updates for new features

## Design Language

**Monsters Ink! Design System** - A retro-futuristic game aesthetic for creature creation

### Visual Identity

The design language evokes a bio-engineering laboratory in a retro gaming universe, combining nostalgia with cutting-edge AI technology. ThinkPixelMon meets Spore, with a dark cyberpunk foundation.

### Typography

- **Primary Font**: Press Start 2P (pixelated retro gaming font)
  - Usage: Buttons, headings, UI labels, game-like elements
  - Implementation: `font-pixel` class
  - Always uppercase for maximum impact
  - Sizes: 8px-12px for UI elements, larger for headings

- **Body Font**: Geist Sans (modern, readable)
  - Usage: Long-form content, descriptions, code
  - Provides contrast to pixelated elements

### Color Palette

**Foundation**: Dark slate backgrounds (slate-900/slate-950) with semi-transparent overlays (no blur effects)

**Accent Colors** (use for actions, states, and emphasis):

- **Cobalt Blue** (`#1E4CDD`): Primary actions, creation
- **Neon Mint** (`#4FFFB0`): View/inspect actions, information, success
- **Soft Peach** (`#FFDAB9`): Neutral states, secondary information
- **Deep Space Violet** (`#240B4D`): Background elements, depth
- **Sunset Orange** (`#FF9F1C`): Warnings, retries, alerts
- **Lush Grass Green** (`#2ECC71`): Live/active states, success (alternative to Neon Mint for variety)

### Button Architecture

**Monster Buttons** follow a consistent pattern:

```
bg-{color}-600/20           // Semi-transparent background
hover:bg-{color}-600/40     // Stronger on hover
border border-{color}-500/50 // Glowing border (use with caution, if applicable to new palette)
hover:border-{color}-400    // Brighter border on hover
text-{color}-300            // Readable text color
hover:text-{color}-100      // Lighter on hover
font-pixel text-[8px-10px]  // Pixelated font, tiny size
uppercase                   // Always uppercase
transition-all              // Smooth transitions
hover:shadow-lg hover:shadow-{color}-500/20 // Colored glow effect (use with caution, if applicable to new palette)
```

**No icons in action buttons** - Pure text for clean, game-like aesthetic

### Status Indicators

Use emoji + colored badges for job/creature states:

- 🥚 Pending (Soft Peach)
- 🎨 Generating (Cobalt Blue)
- 🏗️ Converting (Deep Space Violet)
- ✅ Completed (Neon Mint)
- 🔄 Retrying (Sunset Orange)
- ❌ Failed (Red - assuming red is still an acceptable error color, otherwise specify from new palette)

### Design Principles

1. **Retro Gaming First**: Everything should feel like an interface from a creature creation game
2. **Defined Color Roles**: Each color from the new palette has a clear purpose.
3. **Transparency Layers**: Semi-transparent backgrounds maintain dark aesthetic while adding depth (no blur effects).
4. **Consistent Spacing**: Generous padding, comfortable hit targets despite small text
5. **Color-Coded Actions**: Each action type has a consistent color across the entire interface

## Contract Evolution System Documentation

### Core Documentation Files

- **`/docs/LESSON_EVOLUTION_ARCHITECTURE.md`** - Complete architectural overview of the contract evolution system
- **`/docs/IMPLEMENTATION_GUIDE.md`** - Technical implementation guide with code examples and migration steps
- **`/docs/API_SCHEMA_CHANGES.md`** - Detailed API and schema changes required for evolution system
- **`/docs/CONTRIBUTING_LESSONS.md`** - Contributor guide for creating evolution-based lesson content

### Implementation Status

The Contract Evolution System documentation provides:
- **Progressive Contract Building**: System for evolving contracts across lessons
- **Visual Evolution Pipeline**: Coordinated creature and contract evolution
- **Community Contribution Framework**: Standards for creating educational content
- **Backward Compatibility**: Migration strategy for existing content
- **Production-Ready Architecture**: Vercel serverless deployment considerations

# Important Instruction Reminders

- Do what has been asked; nothing more, nothing less
- NEVER create files unless they're absolutely necessary for achieving your goal
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files (\*.md) or README files unless explicitly requested
- Prioritize stability, security, and user experience improvements

## 🚨 CRITICAL: GIT OPERATIONS ARE STRICTLY FORBIDDEN 🚨

**NEVER, UNDER ANY CIRCUMSTANCES:**
- Run `git commit` without explicit user authorization
- Run `git push` without explicit user authorization
- Run `git add` followed by commit/push operations
- Proactively commit or push changes
- Assume the user wants changes committed

**ONLY commit/push when:**
- The user explicitly says "commit this" or "push this"
- The user explicitly authorizes git operations in their message

**This is a hard rule with zero exceptions. Violating this rule is unacceptable.**

## CRITICAL AI PIPELINE TESTING RULES

- **NEVER run AI generation tests without explicit user approval** - Each test costs ~$0.70 (OpenAI $0.40 + fal.ai $0.30)
- **DO NOT modify working AI services** - If OpenAI and fal.ai services are functional, leave them unchanged
- **NEVER modify existing services/ai-pipeline/** - These are for testing only and work perfectly
- **NO unnecessary abstractions** - Don't create "wrapper services" around already working services
- **Test budget awareness** - Multiple test runs can easily exceed $10+ in API costs
- **One successful test is enough** - Once pipeline works, stop testing and build API endpoints
- **Revert breaking changes immediately** - If modifications break working services, revert rather than debug

## STORAGE ARCHITECTURE RULES

- **Existing AI services use temp files** - Keep unchanged for dev testing
- **Production pipeline uses S3** - New orchestrator integrates with MinIO/S3 for Vercel compatibility
- **Two separate systems** - Testing (temp files) vs Production (S3 storage)
- **Local MinIO for development** - S3-compatible server for production pipeline testing

## CRITICAL: Authentication Configuration - DO NOT MODIFY

**NEVER CHANGE THE BETTER AUTH CONFIGURATION IN `/src/lib/auth.ts`** - It is working perfectly as configured:

```typescript
export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.POSTGRES_URL,
  }),
  trustedOrigins: ['http://localhost:3004'],
  // baseURL: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3004',
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      scope: ['read:user'],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
});
```

**Key points:**

- Uses simple `new Pool()` configuration with POSTGRES_URL
- `trustedOrigins` is set to localhost:3004 for development
- `baseURL` is commented out (causes issues)
- All custom user fields are commented out (causes schema conflicts)
- Works with existing PostgreSQL database tables created manually
- GitHub OAuth is properly configured

**DO NOT:**

- Add custom user fields to Better Auth configuration
- Modify the database adapter configuration
- Change the Pool setup
- Uncomment or modify user field configurations
- Try to "fix" or "improve" this configuration

**This authentication system is production-ready and secure. Leave it alone.**

## Server-Side Authentication Implementation

A comprehensive server-side authentication system has been implemented using Better Auth:

### Core Components

- **`/src/lib/auth-server.ts`** - Server-side authentication utilities
  - `getServerSession()` - Get current session from server context
  - `getSessionFromRequest()` - Get session from API request
  - `requireAuth()` - Require authentication in Server Components
  - `withAuth()` - Higher-order function to protect API routes
  - `validateLessonAccess()` - Check lesson authentication requirements
  - `checkGitHubAccess()` - Verify GitHub repository access

### Lesson Authentication Schema

- **`requiresAuth` parameter** - Added to lesson JSON schema (`LessonStep` interface)
- **Server-side checks** - Implemented in `/src/app/lesson/[lessonId]/[chapterId]/[stepId]/page.tsx`
- **Graceful fallback** - Try/catch error handling for SSR compatibility
- **Client-side modal** - Existing GitHub auth modal integration

### Usage Pattern

```typescript
// In lesson JSON (src/content/lessons/1.json)
{
  "id": 4,
  "requiresAuth": true,
  // ... rest of step
}

// In server component (automatic)
const session = await getServerSession();
const hasAuthSteps = lesson.steps.some(step => step.requiresAuth);
if (hasAuthSteps && !session) {
  // Handle authentication requirement
}
```

## Production AI Pipeline (Vercel Workflows)

The monster generation pipeline is a **durable workflow** designed to handle long-running processes and failures gracefully, leveraging Vercel Workflows (`workflow` package).

### Workflow Architecture
1.  **Trigger:** User requests generation -> API creates `pending` job in DB.
2.  **Step 1: Check Storage:** Verifies S3/MinIO bucket accessibility.
3.  **Step 2: Generate Image:** Calls OpenAI to create a 2D sprite. Idempotency and retries are critical here to avoid double-billing.
4.  **Step 3: Convert to 3D:** Calls fal.ai to convert the sprite to a `.glb` model.
5.  **Step 4: Completion:** Updates DB status to `completed` and records costs.

### Key Directories & Files
*   `src/workflows/` - Vercel Workflow definitions.
    *   `generate-monster.ts` - Main orchestrator.
    *   `steps/` - Individual workflow steps (`check-storage`, `generate-image`, `convert-3d`).
*   `src/app/api/generate-monster/` - Trigger for the AI workflow.
*   `src/lib/generation-job.ts` - State management and DB abstraction for generation jobs.
*   `src/services/` - Service integrations (`production-openai-service.ts`, `s3-service.ts`).

### Development Commands
*   **Start Dev Server:** `vercel dev --listen 3004 --yes` (Required for Workflows to function correctly locally)
*   **Start MinIO Storage:** `npm run storage:start`
*   **Workflow Web UI:** `npm run workflow:web` (Opens browser with correct config to inspect workflow runs)
*   **Database Setup:** `npm run db:migrate`
