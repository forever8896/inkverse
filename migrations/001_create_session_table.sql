-- Session table for Better Auth
CREATE TABLE session (
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

-- Indexes for session table
CREATE INDEX idx_session_userId ON session("userId");
CREATE INDEX idx_session_userid ON session("userId");
CREATE INDEX idx_session_expiresat ON session("expiresAt");
CREATE INDEX idx_session_token ON session(token);
