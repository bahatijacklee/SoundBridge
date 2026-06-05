
# SoundBridge Admin Dashboard Setup Guide

## Overview
This guide walks through setting up the admin dashboard with proper security and admin management.

## Step 1: Run the Migration

1. Go to your Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy the entire content of `supabase/migrations/0003_admin_and_withdrawals.sql`
4. Run the query
5. Verify the new tables were created:
   - `admin_users`
   - `withdrawal_requests`

## Step 2: Create Your First Admin User

To make a user an admin, you need to add a record to the `admin_users` table:

1. First, have the user register through your app (or use an existing user)
2. Get the user's UUID from Supabase Auth → Users tab
3. Go to SQL Editor and run this query (replace the UUID with your user's ID):

```sql
-- Replace 'your-user-uuid-here' with the actual user ID
insert into admin_users (user_id)
values ('your-user-uuid-here');
```

This will automatically set the `is_admin` column on the user's profile to `true` (thanks to our database trigger!).

## Step 3: Test the Admin Dashboard

1. Log in with your admin account
2. Navigate to `/admin`
3. You should see the admin dashboard with:
   - Users Tab: View all users and their details
   - Withdrawals Tab: View and manage withdrawal requests
   - Tasks Tab: View existing tasks

## Admin Features Explained

### 1. Admin Users Table
- Instead of using a simple boolean flag, we use a separate `admin_users` table for better security and auditability
- This follows best practices from the booking system example
- The `is_admin` column on the users table is kept in sync automatically via a database trigger

### 2. Withdrawal Request Flow
- **User Side**:
  - User links a wallet in their account page
  - User requests a withdrawal, selects wallet, enters amount
  - Request is saved with status 'pending'
- **Admin Side**:
  - Admin views all pending requests
  - Admin can approve or reject requests
  - When approved, the processed_at and processed_by fields are updated

### 3. RLS Security Policies
- **Users**: Can only see their own data and withdrawal requests
- **Admins**: Can view and manage all data (users, withdrawals, tasks)
- All actions are protected by Row Level Security

## Next Steps to Expand the Admin Dashboard

1. **Add Create Task Modal**: Let admins create new tasks for users
2. **Add Edit/Delete Tasks**: Manage existing tasks
3. **Transaction Log**: Full view of all user transactions
4. **User Management**: Edit user details, reset VIP status
5. **Email Notifications**: Notify admins of new withdrawal requests
6. **Export Data**: Download CSV reports of users, transactions, etc.

## Manual SQL for Common Admin Tasks

### Grant Admin Privileges to a User
```sql
insert into admin_users (user_id) values ('user-uuid-here');
```

### Revoke Admin Privileges
```sql
delete from admin_users where user_id = 'user-uuid-here';
```

### List All Admins
```sql
select u.id, u.username, u.email, a.created_at
from admin_users a
join users u on a.user_id = u.id;
```

### Approve a Withdrawal Request (SQL)
```sql
update withdrawal_requests
set status = 'approved',
    processed_at = now(),
    processed_by = 'admin-user-uuid-here'
where id = 'withdrawal-request-id-here';
```
