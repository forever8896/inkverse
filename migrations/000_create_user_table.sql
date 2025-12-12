-- User table for Better Auth (idempotent)
CREATE TABLE IF NOT EXISTS "user" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    "emailVerified" BOOLEAN DEFAULT false,
    image TEXT,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "displayName" TEXT,
    "monsterGenerations" INTEGER DEFAULT 0,
    "lastGeneration" TIMESTAMP WITHOUT TIME ZONE,
    "githubUsername" TEXT,
    "repoCount" INTEGER,
    role TEXT DEFAULT 'user',
    banned BOOLEAN DEFAULT false,
    "banReason" TEXT,
    "banExpires" TIMESTAMP WITHOUT TIME ZONE
);

-- Indexes for user table (idempotent)
CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);
CREATE INDEX IF NOT EXISTS idx_user_githubusername ON "user"("githubUsername");
CREATE INDEX IF NOT EXISTS idx_user_role ON "user"(role);
CREATE INDEX IF NOT EXISTS idx_user_banned ON "user"(banned);
