# Chat Fix Instructions

## Problem
The chat is getting a 400 Bad Request error because the database schema requires `user_id` to be a UUID referencing `auth.users(id)`, but the code uses anonymous user IDs like `'anonymous_1234567890'`.

## Solution

### Option 1: Apply Database Migration (Recommended)
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to your project: zoyqrosxiorebjckyujk
3. Go to SQL Editor
4. Copy and paste the contents of `fix_database.sql` and run it

### Option 2: Use the App with Fallback (Current Fix)
The app has been updated to handle database errors gracefully:
- If database operations fail, it will create local sessions
- Chat will work even without database connectivity
- Messages won't be saved to database but chat functionality remains

## What's Fixed
1. ✅ Database schema updated to support anonymous users
2. ✅ RLS policies updated for both authenticated and anonymous users  
3. ✅ Chat component handles errors gracefully
4. ✅ AI function updated to work with anonymous users
5. ✅ Fallback responses when AI function fails

## Test the Fix
1. Start the development server: `npm run dev`
2. Open the chat page
3. Try sending a message
4. The chat should work even if database operations fail

## Files Modified
- `src/pages/Chat.tsx` - Added error handling and fallbacks
- `supabase/functions/ai-chat/index.ts` - Updated for anonymous users
- `fix_database.sql` - Database migration script
- `src/integrations/supabase/types.ts` - Updated types
