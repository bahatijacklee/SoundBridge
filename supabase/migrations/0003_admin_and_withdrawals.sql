-- =========================================
-- SoundBridge Admin & Withdrawal System Migration
-- Follows best practices from booking system example
-- =========================================

-- First, create/update the update_updated_at_column function (if not exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Create Admin Users table (best practice: separate table instead of boolean column)
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- 2. Add is_admin column to users for backward compatibility (but we'll use admin_users as source of truth)
alter table users add column if not exists is_admin boolean default false;

-- 3. Create Withdrawal Requests table
create table withdrawal_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  amount numeric(10,2) not null check (amount > 0),
  wallet_type text not null,
  wallet_address text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  processed_at timestamp with time zone,
  processed_by uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. Create indexes for performance
create index idx_withdrawal_requests_user_id on withdrawal_requests(user_id);
create index idx_withdrawal_requests_status on withdrawal_requests(status);

-- 5. Enable RLS
alter table admin_users enable row level security;
alter table withdrawal_requests enable row level security;

-- =========================================
-- RLS POLICIES
-- =========================================

-- POLICIES: ADMIN_USERS
-- Users can read their own admin row
create policy "Users can read their own admin row"
on admin_users
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can manage admin_users
create policy "Admins can manage admin users"
on admin_users
for all
to authenticated
using (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
);

-- POLICIES: WITHDRAWAL_REQUESTS
-- Users can create their own withdrawal requests
create policy "Users can create their own withdrawal requests"
on withdrawal_requests
for insert
to authenticated
with check (auth.uid() = user_id);

-- Users can read their own withdrawal requests
create policy "Users can read their own withdrawal requests"
on withdrawal_requests
for select
to authenticated
using (auth.uid() = user_id);

-- Admins can read all withdrawal requests
create policy "Admins can read all withdrawal requests"
on withdrawal_requests
for select
to authenticated
using (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
);

-- Admins can update withdrawal requests
create policy "Admins can update withdrawal requests"
on withdrawal_requests
for update
to authenticated
using (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
);

-- =========================================
-- UPDATE EXISTING TABLES (USERS)
-- =========================================

-- Add updated_at trigger to users if not exists
do $$
begin
  if not exists (
    select 1
    from information_schema.triggers
    where trigger_name = 'update_users_updated_at'
  ) then
    create trigger update_users_updated_at
    before update on users
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

-- =========================================
-- BACKWARD COMPATIBILITY
-- Sync is_admin column with admin_users table
-- =========================================

-- Function to sync users.is_admin when admin_users changes
create or replace function sync_user_is_admin()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update users set is_admin = true where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update users set is_admin = false where id = old.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to sync is_admin column
create trigger trigger_sync_user_is_admin
after insert or delete on admin_users
for each row
execute function sync_user_is_admin();

-- =========================================
-- UPDATE UPDATED_AT TRIGGER FOR WITHDRAWAL_REQUESTS
-- =========================================

do $$
begin
  if not exists (
    select 1
    from information_schema.triggers
    where trigger_name = 'update_withdrawal_requests_updated_at'
  ) then
    create trigger update_withdrawal_requests_updated_at
    before update on withdrawal_requests
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

-- =========================================
-- UPDATE EXISTING RLS POLICIES (ADD ADMIN ACCESS TO EXISTING TABLES)
-- =========================================

-- Policies for USERS table: Allow admins to read all users
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'users' and policyname = 'Admins can read all users'
  ) then
    create policy "Admins can read all users"
    on users
    for select
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Policies for TASKS table: Allow admins to manage tasks
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'tasks' and policyname = 'Admins can manage tasks'
  ) then
    create policy "Admins can manage tasks"
    on tasks
    for all
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Policies for TRANSACTIONS table: Allow admins to read all transactions
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'transactions' and policyname = 'Admins can read all transactions'
  ) then
    create policy "Admins can read all transactions"
    on transactions
    for select
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Policies for USER_TASKS table: Allow admins to read all user tasks
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'user_tasks' and policyname = 'Admins can read all user tasks'
  ) then
    create policy "Admins can read all user tasks"
    on user_tasks
    for select
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Policies for LEVEL_PROGRESS table: Allow admins to read all level progress
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'level_progress' and policyname = 'Admins can read all level progress'
  ) then
    create policy "Admins can read all level progress"
    on level_progress
    for select
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

-- Policies for ARTISTS table: Allow admins to manage artists
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where tablename = 'artists' and policyname = 'Admins can manage artists'
  ) then
    create policy "Admins can manage artists"
    on artists
    for all
    to authenticated
    using (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from admin_users
        where admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;
