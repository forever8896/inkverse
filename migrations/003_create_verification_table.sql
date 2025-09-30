-- Verification table for Better Auth (email verification, password reset)
CREATE TABLE verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for verification table
CREATE INDEX idx_verification_identifier ON verification(identifier);
CREATE INDEX idx_verification_expiresat ON verification("expiresAt");
