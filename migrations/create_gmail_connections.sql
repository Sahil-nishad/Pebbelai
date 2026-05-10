-- Create gmail_connections table
CREATE TABLE IF NOT EXISTS public.gmail_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    encrypted_refresh_token TEXT,
    encrypted_access_token TEXT,
    token_expiry TIMESTAMPTZ,
    scopes JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_email_date TIMESTAMPTZ,
    emails_sent_today INTEGER DEFAULT 0,
    daily_limit INTEGER DEFAULT 25,
    oauth_state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gmail_connections ENABLE ROW LEVEL SECURITY;

-- Create policies (cast auth.uid() to text)
CREATE POLICY "Users can view own gmail" ON public.gmail_connections
    FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert own gmail" ON public.gmail_connections
    FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update own gmail" ON public.gmail_connections
    FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete own gmail" ON public.gmail_connections
    FOR DELETE USING (user_id = auth.uid()::text);