-- =========================================
-- FIX: 500 Error on Admin Users Table
-- =========================================

-- Step 1: Disable RLS temporarily (just to make setup easier)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies for admin_users
DROP POLICY IF EXISTS "Admins can read all admin users" ON admin_users;
DROP POLICY IF EXISTS "Users can read their own admin status" ON admin_users;

-- Step 3: Create simple, safe policies
-- Policy 1: Allow authenticated users to read their own entry
CREATE POLICY "Users can read own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Allow admins to manage admin_users (optional, but safe)
CREATE POLICY "Admins can manage admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM admin_users
      WHERE user_id = auth.uid()
    )
  );

-- Step 4: Re-enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Verify the policies are there
SELECT * FROM pg_policies WHERE tablename = 'admin_users';
