-- =========================================
-- SAFE: Recreate admin_users Table (if needed)
-- =========================================

-- Step 1: Disable RLS first
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Step 2: Backup existing data (if any)
CREATE TABLE IF NOT EXISTS admin_users_backup AS TABLE admin_users;

-- Step 3: Drop and recreate table
DROP TABLE IF EXISTS admin_users CASCADE;

CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Restore backup (if there was data)
INSERT INTO admin_users (user_id)
SELECT user_id FROM admin_users_backup
ON CONFLICT DO NOTHING;

-- Step 5: Add unique index on user_id
CREATE UNIQUE INDEX idx_admin_users_user_id ON admin_users(user_id);

-- Step 6: Add RLS policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to let users read their own status
CREATE POLICY "Users can read own admin status"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy to let admins manage the table
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

-- Verify it's working
SELECT * FROM admin_users;
