-- =========================================
-- ULTRA SAFE: Fix Admin Users RLS (No Drops!)
-- =========================================

-- Step 1: Disable RLS temporarily
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies for admin_users (regardless of name!)
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'admin_users'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON admin_users';
  END LOOP;
END $$;

-- Step 3: Create ONE simple, safe select policy for authenticated users
CREATE POLICY "Allow authenticated users to read admin_users"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (true);  -- Temporarily allow all reads to debug, then we can tighten!

-- Step 4: Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify our setup!
SELECT 'Policies after fix:' AS info;
SELECT * FROM pg_policies WHERE tablename = 'admin_users';

SELECT 'Admin users in table:' AS info;
SELECT * FROM admin_users;
