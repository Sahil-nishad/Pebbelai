-- Run this script in your Supabase SQL Editor to create the necessary tables

-- 1. Create a resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    template_id TEXT NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    layout_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Setup Row Level Security (RLS) for the resumes table
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy: Users can only select their own resumes
CREATE POLICY "Users can view their own resumes" 
ON public.resumes FOR SELECT 
USING (auth.uid() = user_id);

-- 4. Create a policy: Users can insert their own resumes
CREATE POLICY "Users can insert their own resumes" 
ON public.resumes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 5. Create a policy: Users can update their own resumes
CREATE POLICY "Users can update their own resumes" 
ON public.resumes FOR UPDATE 
USING (auth.uid() = user_id);

-- 6. Create a policy: Users can delete their own resumes
CREATE POLICY "Users can delete their own resumes" 
ON public.resumes FOR DELETE 
USING (auth.uid() = user_id);
