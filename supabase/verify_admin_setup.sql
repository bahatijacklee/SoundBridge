-- =========================================
-- VERIFY ADMIN SETUP SCRIPT (FIXED)
-- =========================================

-- 1. Check if admin_users table exists
DO $$
BEGIN
  RAISE NOTICE '✅ Checking admin_users table...';
END $$;

SELECT 
  'admin_users table' AS check_item,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') AS table_exists;

-- 2. Check if withdrawal_requests table exists
DO $$
BEGIN
  RAISE NOTICE '✅ Checking withdrawal_requests table...';
END $$;

SELECT 
  'withdrawal_requests table' AS check_item,
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') AS table_exists;

-- 3. Check if is_admin column exists on users table
DO $$
BEGIN
  RAISE NOTICE '✅ Checking users.is_admin column...';
END $$;

SELECT 
  'users.is_admin column' AS check_item,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_admin') AS column_exists;

-- 4. List all admin users
DO $$
BEGIN
  RAISE NOTICE '✅ Listing admin users...';
END $$;

SELECT 
  'Admin users' AS section,
  user_id,
  created_at
FROM admin_users;

-- 5. List users with is_admin = true
DO $$
BEGIN
  RAISE NOTICE '✅ Listing users with is_admin = true...';
END $$;

SELECT 
  'Users with is_admin=true' AS section,
  id,
  username,
  is_admin
FROM users
WHERE is_admin = true;

-- 6. List all RLS policies for key tables (simple version)
DO $$
BEGIN
  RAISE NOTICE '✅ Listing RLS policies...';
END $$;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('users', 'tasks', 'transactions', 'admin_users', 'withdrawal_requests');
