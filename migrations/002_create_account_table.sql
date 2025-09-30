-- Account table for Better Auth (OAuth providers)
CREATE TABLE account (
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

-- Indexes for account table
CREATE INDEX idx_account_userId ON account("userId");
CREATE INDEX idx_account_userid ON account("userId");
CREATE INDEX idx_account_providerId_accountId ON account("providerId", "accountId");
