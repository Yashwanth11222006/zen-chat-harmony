-- Fix anonymous user support by changing user_id from UUID to TEXT
-- This allows both authenticated users (UUID) and anonymous users (text like 'anonymous_123')

-- First, drop existing foreign key constraints
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

-- Change user_id columns from UUID to TEXT
ALTER TABLE public.chat_sessions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN user_id TYPE TEXT;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can update their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can delete their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can create their own chat messages" ON public.chat_messages;

-- Create new RLS policies that support both authenticated and anonymous users
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
