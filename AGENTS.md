# Repository Guidelines

## Project Structure & Module Organization
Next.js routes, layouts, and server actions live in `src/app`; reusable UI and stateful helpers are in `src/components`, `src/hooks`, and `src/stores`. Platform glue sits in `src/config`, `src/lib`, and `src/services`, all addressable through the `@` alias. Database migrations live in `migrations/`, automation scripts in `scripts/`, static assets in `public/`, AI references in `nft-metadata/`, and shared fixtures plus setup files in `src/test/`.

## Build, Test, and Development Commands
`npm run dev` starts the Turbopack server on port 3004 (pre-cleared by `predev`), while `npm run build` and `npm start` handle production. Keep quality intact with `npm run lint`, `npm run typecheck`, and `npm run format`. Data workflows rely on `npm run db:migrate` (alias `db:setup`) and the destructive `npm run db:reset`. Launch the local MinIO instance needed for asset generation with `npm run storage:start`.

## Coding Style & Naming Conventions
The stack is TypeScript-first, linted by Next.js + ESLint 9, and auto-formatted with Prettier 3; run the formatter before committing multi-file changes. Prefer two-space indentation, `camelCase` for functions and variables, and `PascalCase` for React components and hooks. Route directories under `src/app` stay `kebab-case`, and Tailwind utilities should be grouped from layout → color → effects for readability.

## Testing Guidelines
Vitest (`npm run test`) drives unit coverage using the defaults in `vitest.config.ts` and shared setup from `src/test/setup.ts`. Place specs beside the code as `*.test.ts[x]` or `*.spec.ts[x]`, and name `describe` blocks after the feature being exercised. Integration tests call real AI services—opt in with `RUN_INTEGRATION_TESTS=1 npm run test`, expect the CLI confirmation prompt, and document any spend before merging.

## Commit & Pull Request Guidelines
Recent history favors concise, imperative commit subjects (for example, "Fix admin role checking"), so mirror that style and keep bodies for context or follow-up commands. Pull requests should restate the problem, describe the fix, list verification steps (`npm run lint && npm run test` minimum), and link issues or lesson plans. UI-facing changes need screenshots, and any schema or migration must mention the matching `db:migrate` step for reviewers.

## Environment & Secrets
Copy `.env.example` to `.env.local` and populate PostgreSQL, Better Auth, and GitHub OAuth variables before running anything. Optional integrations—OpenAI, fal.ai, and MinIO/S3—live in the same file; never commit secrets and rotate keys before demos. Use project-scoped `.env.local` overrides rather than global shell exports to keep dev and CI environments predictable.
