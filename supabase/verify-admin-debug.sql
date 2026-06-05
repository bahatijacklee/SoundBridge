-- =========================================
-- DEBUG: Verify Admin Setup
-- =========================================

-- 1. List all users with their ids
SELECT id, username, is_admin FROM users;

-- 2. List all entries in admin_users table
SELECT * FROM admin_users;

-- 3. Verify RLS policies are present (run separately)
SELECT * FROM pg_policies WHERE tablename = 'admin_users';
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 4. If you need to add a specific user to admin_users (replace with your user id!)
-- INSERT INTO admin_users (user_id) VALUES ('YOUR-USER-UUID-HERE');
