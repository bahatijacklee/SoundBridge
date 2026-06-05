-- QUICK CHECK: Just run this to see the important stuff!

-- 1. Are you in admin_users?
SELECT 'Admin users:' AS info;
SELECT * FROM admin_users;

-- 2. Do you have is_admin=true on your user?
SELECT 'Users with is_admin=true:' AS info;
SELECT id, username, is_admin FROM users WHERE is_admin = true;

-- 3. Check if withdrawal_requests exists
SELECT 'Does withdrawal_requests exist?:' AS info;
SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') AS withdrawal_requests_exists;
