# Admin Dashboard Final Setup Guide

## Quick Start (3 Steps)

---

## Step 1: Run the Migration in Supabase Dashboard
1. Open your Supabase project
2. Go to **SQL Editor** → **New Query**
3. Copy & paste the entire content from:
   `supabase/migrations/0003_admin_and_withdrawals.sql`
4. Click **Run**

---

## Step 2: Run the RLS Fix
1. Still in **SQL Editor** → **New Query**
2. Copy & paste the entire content from:
   `supabase/fix_admin_rls_policies.sql`
3. Click **Run**

---

## Step 3: Make Yourself an Admin
1. In Supabase, go to **Authentication** → **Users**
2. Copy your User UID
3. Go back to **SQL Editor** → **New Query**
4. Run this (replace the UUID with yours):
```sql
insert into admin_users (user_id)
values ('your-user-uuid-here');
```

---

## Step 4: Test It!
1. Restart your dev server
2. Log in with your admin account
3. Navigate to `/admin`

✅ You should see the admin dashboard!

---

## What We Fixed
- Added proper admin check using `admin_users` table (like the booking system)
- Fixed RLS policies for all tables
- Added error handling and loading states
- Fixed data types for numeric fields
- Removed non-existent `email` column from users table

---

## Features
- 📊 View all users, their earnings & points
- 💸 Approve/reject withdrawal requests
- 📝 View all tasks
- 🔒 Secure RLS-based admin access