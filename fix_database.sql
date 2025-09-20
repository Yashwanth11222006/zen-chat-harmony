-- Complete Database Fix for Anonymous User Support
-- Run this in your Supabase Dashboard > SQL Editor

-- Step 1: Drop existing foreign key constraints
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

-- Step 2: Change user_id columns from UUID to TEXT to support anonymous users
ALTER TABLE public.chat_sessions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE TEXT;

-- Step 3: Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.chat_messages;

-- Step 4: Create new RLS policies that support both authenticated and anonymous users
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can create their own chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions 
FOR UPDATE 
USING (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions 
FOR DELETE 
USING (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can view their own chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

CREATE POLICY "Users can create their own chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anonymous_%');

-- Step 5: Create a more permissive policy for anonymous users
-- This allows anonymous users to access their data without authentication
CREATE POLICY "Allow anonymous chat access" 
ON public.chat_sessions 
FOR ALL 
USING (user_id LIKE 'anonymous_%');

CREATE POLICY "Allow anonymous message access" 
ON public.chat_messages 
FOR ALL 
USING (user_id LIKE 'anonymous_%');
