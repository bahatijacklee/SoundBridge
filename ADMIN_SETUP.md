
# Admin Dashboard Setup Guide

## Step 1: Run Database Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the entire content of `supabase/migrations/0003_add_withdrawal_requests_and_admin_features.sql`
4. Run the query
5. Verify that:
   - `withdrawal_requests` table was created
   - `is_admin` column is added to `users` table
   - RLS policies are enabled

## Step 2: Create Your First Admin User

1. First, register a new user through your app
2. Then, in the Supabase Dashboard → SQL Editor, run this query:

```sql
-- Replace 'your-email@example.com' with the email of the user you want to make admin
UPDATE users
SET is_admin = true
WHERE email = 'your-email@example.com';
```

This will grant admin privileges to that user.

## Step 3: Test the Admin Dashboard

1. Log in with the admin user account
2. Navigate to `/admin` in your browser
3. You should see the admin dashboard with three tabs:
   - Users: View all users
   - Withdrawals: Approve/reject withdrawal requests
   - Tasks: View and manage tasks

## Step 4: Set Up Task Creation (Optional)

If you want to add task creation functionality, you can expand the admin dashboard with a modal similar to the user creation.

## Features Overview

### Admin Dashboard
- **Users Tab**: View all registered users with their stats (earnings, points, VIP status, admin status)
- **Withdrawals Tab**: Approve or reject withdrawal requests with user info and wallet details
- **Tasks Tab**: View all tasks and create new ones (you can expand this with a create task modal)

### Withdrawal Flow
1. User clicks "Withdraw" on their account page
2. User selects a linked wallet and enters amount
3. Withdrawal request is created with status "pending"
4. Admin sees the request in the Withdrawals tab
5. Admin approves or rejects the request
6. If approved, you should manually send the crypto to the user's wallet address

## Security Notes

- **RLS Policies**: The database uses RLS to ensure:
  - Users can only see their own withdrawal requests
  - Only admins can view and update all withdrawal requests
  - All admin actions require authentication

- **Service Role Key**: Never expose your service role key in client-side code

## Next Steps

1. Set up email notifications for admins when new withdrawal requests are submitted
2. Add a transaction record in the database when a withdrawal is approved
3. Implement task creation functionality in the admin dashboard
4. Add audit logs for admin actions
