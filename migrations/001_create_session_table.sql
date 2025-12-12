-- Session table for Better Auth (idempotent)
CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    token TEXT UNIQUE,
    "impersonatedBy" TEXT,
    FOREIGN KEY ("userId") REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for session table (idempotent)
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session("userId");
CREATE INDEX IF NOT EXISTS idx_session_expires_at ON session("expiresAt");
CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
