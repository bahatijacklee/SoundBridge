-- =========================================
-- SAFE UPDATE: Add missing parts to existing DB
-- No table creation (just updates, triggers, policies, indexes)
-- =========================================

-- 1. Make sure update_updated_at_column function exists
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 2. Add is_admin column to users if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'users' and column_name = 'is_admin'
  ) then
    alter table users add column is_admin boolean default false;
  end if;
end $$;

-- 3. Add updated_at column to users if missing
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'users' and column_name = 'updated_at'
  ) then
    alter table users add column updated_at timestamp without time zone default now();
  end if;
end $$;

-- 4. Create withdrawal_requests table ONLY IF NOT EXISTS
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_name = 'withdrawal_requests'
  ) then
    create table withdrawal_requests (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references public.users(id) on delete cascade,
      amount numeric not null,
      wallet_type text not null,
      wallet_address text not null,
      status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
      notes text,
      processed_at timestamp with time zone,
      processed_by uuid references auth.users(id),
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  end if;
end $$;

-- 5. Create indexes on withdrawal_requests (if not exist)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'withdrawal_requests' and indexname = 'idx_withdrawal_requests_user_id'
  ) then
    create index idx_withdrawal_requests_user_id on withdrawal_requests(user_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where tablename = 'withdrawal_requests' and indexname = 'idx_withdrawal_requests_status'
  ) then
    create index idx_withdrawal_requests_status on withdrawal_requests(status);
  end if;
end $$;

-- 6. Enable RLS on admin_users and withdrawal_requests (if not already)
alter table admin_users enable row level security;
alter table withdrawal_requests enable row level security;

-- 7. Add missing RLS policies (safe check)

-- Policy: Users can read their own admin row
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_users' and policyname = 'Users can read their own admin row'
  ) then
    create policy "Users can read their own admin row"
    on admin_users
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Admins can manage admin_users
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'admin_users' and policyname = 'Admins can manage admin users'
  ) then
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
  end if;
end $$;

-- Policy: Users can create their own withdrawal requests
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'withdrawal_requests' and policyname = 'Users can create their own withdrawal requests'
  ) then
    create policy "Users can create their own withdrawal requests"
    on withdrawal_requests
    for insert
    to authenticated
    with check (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Users can read their own withdrawal requests
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'withdrawal_requests' and policyname = 'Users can read their own withdrawal requests'
  ) then
    create policy "Users can read their own withdrawal requests"
    on withdrawal_requests
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end $$;

-- Policy: Admins can read all withdrawal requests
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'withdrawal_requests' and policyname = 'Admins can read all withdrawal requests'
  ) then
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
  end if;
end $$;

-- Policy: Admins can update withdrawal requests
do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'withdrawal_requests' and policyname = 'Admins can update withdrawal requests'
  ) then
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
  end if;
end $$;

-- 8. Add updated_at triggers (if not exist)

-- Trigger for users table
do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'update_users_updated_at'
  ) then
    create trigger update_users_updated_at
    before update on users
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

-- Trigger for withdrawal_requests table
do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'update_withdrawal_requests_updated_at'
  ) then
    create trigger update_withdrawal_requests_updated_at
    before update on withdrawal_requests
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

-- 9. Create sync_user_is_admin function and trigger (if not exist)
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

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'trigger_sync_user_is_admin'
  ) then
    create trigger trigger_sync_user_is_admin
    after insert or delete on admin_users
    for each row
    execute function sync_user_is_admin();
  end if;
end $$;

-- 10. Sync existing admin_users to users.is_admin
update users
set is_admin = true
where id in (select user_id from admin_users);

-- 11. Add RLS policies for existing tables (admins can read)

-- Users table
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

-- Tasks table
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

-- Transactions table
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

-- User_tasks table
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

-- Level_progress table
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

-- Artists table
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

-- 12. Withdrawal approval/rejection RPCs (admin-only, atomic)
create or replace function public.approve_withdrawal_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_amount numeric;
  v_wallet_type text;
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'not_authorized';
  end if;

  select wr.user_id, wr.amount, wr.wallet_type
  into v_user_id, v_amount, v_wallet_type
  from public.withdrawal_requests wr
  where wr.id = p_request_id
  for update;

  if not found then
    raise exception 'request_not_found';
  end if;

  if (select status from public.withdrawal_requests where id = p_request_id) <> 'pending' then
    return;
  end if;

  update public.users
  set total_earnings = total_earnings - v_amount
  where id = v_user_id
    and total_earnings >= v_amount;

  if not found then
    raise exception 'insufficient_balance';
  end if;

  update public.withdrawal_requests
  set status = 'approved',
      processed_at = now(),
      processed_by = auth.uid(),
      updated_at = now()
  where id = p_request_id
    and status = 'pending';

  insert into public.transactions (user_id, transaction_type, amount, description, status)
  values (v_user_id, 'withdrawal', v_amount, 'Withdrawal approved', 'completed');
end;
$$;

create or replace function public.reject_withdrawal_request(p_request_id uuid, p_notes text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'not_authorized';
  end if;

  update public.withdrawal_requests
  set status = 'rejected',
      notes = coalesce(p_notes, notes),
      processed_at = now(),
      processed_by = auth.uid(),
      updated_at = now()
  where id = p_request_id
    and status = 'pending';
end;
$$;

grant execute on function public.approve_withdrawal_request(uuid) to authenticated;
grant execute on function public.reject_withdrawal_request(uuid, text) to authenticated;
