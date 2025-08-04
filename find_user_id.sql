-- Find your user ID
-- Run this in Supabase SQL Editor to get your user ID

SELECT 
  id,
  email,
  created_at
FROM auth.users 
WHERE email = 'your-email@example.com'; -- Replace with your actual email

-- Or to see all users:
-- SELECT id, email, created_at FROM auth.users LIMIT 10; 