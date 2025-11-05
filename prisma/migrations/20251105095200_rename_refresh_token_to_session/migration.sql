-- Rename table from refresh_tokens to sessions
ALTER TABLE "refresh_tokens" RENAME TO "sessions";

-- Rename column from token to refreshToken
ALTER TABLE "sessions" RENAME COLUMN "token" TO "refreshToken";

-- Update constraint names (optional but good practice)
ALTER INDEX "refresh_tokens_pkey" RENAME TO "sessions_pkey";
ALTER INDEX "refresh_tokens_token_key" RENAME TO "sessions_refreshToken_key";
ALTER TABLE "sessions" RENAME CONSTRAINT "refresh_tokens_userId_fkey" TO "sessions_userId_fkey";
