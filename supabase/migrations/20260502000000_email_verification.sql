-- Add email_verified flag to users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- All existing users are already active — mark them verified
UPDATE public.users SET email_verified = TRUE;

-- Email verification tokens
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evtoken_token   ON public.email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_evtoken_expires ON public.email_verification_tokens(expires_at);
ALTER TABLE public.email_verification_tokens DISABLE ROW LEVEL SECURITY;

-- Short-lived one-time tokens used to auto-sign in after email verification
CREATE TABLE IF NOT EXISTS public.auto_login_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alttoken_token ON public.auto_login_tokens(token);
ALTER TABLE public.auto_login_tokens DISABLE ROW LEVEL SECURITY;
