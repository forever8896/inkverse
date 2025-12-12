-- Account table for Better Auth (OAuth providers) (idempotent)
CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    scope TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
    "refreshTokenExpiresAt" TIMESTAMP WITHOUT TIME ZONE,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE,
    UNIQUE ("providerId", "accountId")
);

-- Indexes for account table (idempotent)
CREATE INDEX IF NOT EXISTS idx_account_user_id ON account("userId");
CREATE INDEX IF NOT EXISTS idx_account_provider_id_account_id ON account("providerId", "accountId");
