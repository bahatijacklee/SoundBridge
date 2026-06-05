-- =========================================
-- Quick Fix: Add Missing Admin RLS Policies
-- (Fixed for Postgres - uses DO blocks to check existing policies)
-- =========================================

-- 1. Make sure the update_updated_at function exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Add admin policies to all necessary tables

-- POLICY: Users - Admins can read all users
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

-- POLICY: Tasks - Admins can manage tasks
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

-- POLICY: Transactions - Admins can read all transactions
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

-- POLICY: User Tasks - Admins can read all user tasks
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

-- POLICY: Level Progress - Admins can read all level progress
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

-- POLICY: Artists - Admins can manage artists
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
