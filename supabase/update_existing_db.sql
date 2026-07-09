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

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'users' and column_name = 'phone_number'
  ) then
    alter table users add column phone_number text;
  end if;
end $$;

create or replace function public.fill_users_phone_number()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_phone text;
begin
  if new.phone_number is null or btrim(new.phone_number) = '' then
    select au.raw_user_meta_data->>'phone_number'
    into v_phone
    from auth.users au
    where au.id = new.id;

    if v_phone is not null and btrim(v_phone) <> '' then
      new.phone_number := v_phone;
    end if;
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from information_schema.triggers
    where trigger_name = 'fill_users_phone_number'
  ) then
    create trigger fill_users_phone_number
    before insert on public.users
    for each row
    execute function public.fill_users_phone_number();
  end if;
end $$;

update public.users u
set phone_number = au.raw_user_meta_data->>'phone_number'
from auth.users au
where au.id = u.id
  and (u.phone_number is null or btrim(u.phone_number) = '')
  and au.raw_user_meta_data ? 'phone_number';

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

-- 13. Admin-only users listing (includes auth.users.email)
create or replace function public.admin_list_users()
returns table (
  id uuid,
  username text,
  email text,
  phone_number text,
  total_earnings numeric,
  total_points integer,
  is_vip boolean,
  is_admin boolean,
  created_at timestamp without time zone
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    u.id,
    u.username,
    au.email::text,
    u.phone_number::text,
    u.total_earnings,
    u.total_points,
    u.is_vip,
    u.is_admin,
    u.created_at
  from public.users u
  left join auth.users au on au.id = u.id
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- 14. Admin deposits (credit user balance)
create or replace function public.admin_create_deposit(
  p_user_id uuid,
  p_amount numeric,
  p_description text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'not_authorized';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  perform 1
  from public.users u
  where u.id = p_user_id
  for update;

  if not found then
    raise exception 'user_not_found';
  end if;

  update public.users
  set total_earnings = total_earnings + p_amount,
      updated_at = now()
  where id = p_user_id;

  insert into public.transactions (user_id, transaction_type, amount, description, status)
  values (
    p_user_id,
    'deposit',
    p_amount,
    coalesce(nullif(btrim(p_description), ''), 'Admin deposit'),
    'completed'
  );
end;
$$;

revoke execute on function public.admin_create_deposit(uuid, numeric, text) from public;
grant execute on function public.admin_create_deposit(uuid, numeric, text) to authenticated;

-- 15. Task level pricing + paid level workflow
do $$
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'level_pricing'
  ) then
    create table public.level_pricing (
      level text primary key,
      price numeric not null default 0,
      updated_at timestamp without time zone default now(),
      constraint level_pricing_level_check check (level in ('bronze', 'silver', 'gold', 'platinum')),
      constraint level_pricing_price_check check (price >= 0)
    );
  end if;
end $$;

alter table public.level_pricing enable row level security;

insert into public.level_pricing (level, price)
values
  ('bronze', 0),
  ('silver', 15),
  ('gold', 50),
  ('platinum', 150)
on conflict (level) do nothing;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'active_level_cycle_id'
  ) then
    alter table public.level_progress add column active_level_cycle_id uuid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'active_paid_level'
  ) then
    alter table public.level_progress add column active_paid_level text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'highest_completed_level'
  ) then
    alter table public.level_progress add column highest_completed_level text default 'bronze';
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'silver_cycles_completed'
  ) then
    alter table public.level_progress add column silver_cycles_completed integer not null default 0;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'gold_cycles_completed'
  ) then
    alter table public.level_progress add column gold_cycles_completed integer not null default 0;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'level_progress' and column_name = 'platinum_cycles_completed'
  ) then
    alter table public.level_progress add column platinum_cycles_completed integer not null default 0;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_tasks' and column_name = 'task_level'
  ) then
    alter table public.user_tasks add column task_level text;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_tasks' and column_name = 'level_cycle_id'
  ) then
    alter table public.user_tasks add column level_cycle_id uuid;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'user_tasks'
      and constraint_name = 'user_tasks_user_task_date_unique'
  ) then
    alter table public.user_tasks
      drop constraint user_tasks_user_task_date_unique;
  end if;
end $$;

drop index if exists public.user_tasks_user_task_date_unique;

do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and indexname = 'idx_user_tasks_paid_cycle_unique'
  ) then
    create unique index idx_user_tasks_paid_cycle_unique
      on public.user_tasks(user_id, task_id, level_cycle_id)
      where level_cycle_id is not null;
  end if;
end $$;

update public.level_progress
set current_level = 'bronze'
where current_level is null or btrim(current_level) = '';

update public.level_progress
set active_paid_level = null
where active_paid_level is not null and btrim(active_paid_level) = '';

update public.level_progress
set highest_completed_level = 'bronze'
where highest_completed_level is null or btrim(highest_completed_level) = '';

update public.level_progress
set silver_cycles_completed = 0
where silver_cycles_completed is null;

update public.level_progress
set gold_cycles_completed = 0
where gold_cycles_completed is null;

update public.level_progress
set platinum_cycles_completed = 0
where platinum_cycles_completed is null;

with bronze_totals as (
  select count(*) as total_tasks
  from public.tasks
  where lower(coalesce(required_level, 'bronze')) = 'bronze'
),
bronze_completions as (
  select user_id, count(distinct task_id) as completed_tasks
  from public.user_tasks
  where lower(coalesce(task_level, 'bronze')) = 'bronze'
  group by user_id
)
update public.level_progress lp
set current_level = 'silver'
from bronze_totals bt, bronze_completions bc
where bt.total_tasks > 0
  and bc.user_id = lp.user_id
  and bc.completed_tasks >= bt.total_tasks
  and coalesce(lp.current_level, 'bronze') = 'bronze';

insert into public.level_progress (user_id, current_level, progress_percentage, total_tasks_completed, total_artists_engaged, updated_at)
select u.id, 'bronze', 0, 0, 0, now()
from public.users u
where not exists (
  select 1
  from public.level_progress lp
  where lp.user_id = u.id
);

update public.user_tasks ut
set task_level = lower(coalesce(t.required_level, 'bronze'))
from public.tasks t
where t.id = ut.task_id
  and (ut.task_level is null or btrim(ut.task_level) = '');

with level_totals as (
  select lower(coalesce(required_level, 'bronze')) as level_name, count(*) as total_tasks
  from public.tasks
  where lower(coalesce(required_level, 'bronze')) in ('silver', 'gold', 'platinum')
  group by 1
),
level_completions as (
  select
    ut.user_id,
    lower(coalesce(ut.task_level, 'bronze')) as level_name,
    count(distinct ut.task_id) as completed_tasks
  from public.user_tasks ut
  where lower(coalesce(ut.task_level, 'bronze')) in ('silver', 'gold', 'platinum')
  group by 1, 2
),
highest_per_user as (
  select
    lc.user_id,
    case
      when exists (
        select 1
        from level_completions x
        join level_totals t on t.level_name = x.level_name
        where x.user_id = lc.user_id
          and x.level_name = 'platinum'
          and x.completed_tasks >= t.total_tasks
      ) then 'platinum'
      when exists (
        select 1
        from level_completions x
        join level_totals t on t.level_name = x.level_name
        where x.user_id = lc.user_id
          and x.level_name = 'gold'
          and x.completed_tasks >= t.total_tasks
      ) then 'gold'
      when exists (
        select 1
        from level_completions x
        join level_totals t on t.level_name = x.level_name
        where x.user_id = lc.user_id
          and x.level_name = 'silver'
          and x.completed_tasks >= t.total_tasks
      ) then 'silver'
      else 'bronze'
    end as highest_completed_level
  from level_completions lc
  group by lc.user_id
)
update public.level_progress lp
set highest_completed_level = h.highest_completed_level
from highest_per_user h
where h.user_id = lp.user_id;

with cycle_counts as (
  select
    user_id,
    count(distinct level_cycle_id) filter (
      where lower(coalesce(task_level, 'bronze')) = 'silver'
        and level_cycle_id is not null
    ) as silver_cycles_completed,
    count(distinct level_cycle_id) filter (
      where lower(coalesce(task_level, 'bronze')) = 'gold'
        and level_cycle_id is not null
    ) as gold_cycles_completed,
    count(distinct level_cycle_id) filter (
      where lower(coalesce(task_level, 'bronze')) = 'platinum'
        and level_cycle_id is not null
    ) as platinum_cycles_completed
  from public.user_tasks
  group by user_id
)
update public.level_progress lp
set silver_cycles_completed = coalesce(c.silver_cycles_completed, 0),
    gold_cycles_completed = coalesce(c.gold_cycles_completed, 0),
    platinum_cycles_completed = coalesce(c.platinum_cycles_completed, 0),
    current_level = case
      when coalesce(c.gold_cycles_completed, 0) >= 2 then 'platinum'
      when coalesce(c.silver_cycles_completed, 0) >= 3 then 'gold'
      when coalesce(c.silver_cycles_completed, 0) > 0 then 'silver'
      else current_level
    end,
    highest_completed_level = case
      when coalesce(c.platinum_cycles_completed, 0) > 0 or coalesce(c.gold_cycles_completed, 0) >= 2 then 'platinum'
      when coalesce(c.gold_cycles_completed, 0) > 0 then 'gold'
      when coalesce(c.silver_cycles_completed, 0) > 0 then 'silver'
      else 'bronze'
    end
from cycle_counts c
where c.user_id = lp.user_id;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'tasks'
      and indexname = 'idx_tasks_required_level'
  ) then
    create index idx_tasks_required_level on public.tasks(required_level);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and tablename = 'user_tasks'
      and indexname = 'idx_user_tasks_user_level_cycle'
  ) then
    create index idx_user_tasks_user_level_cycle on public.user_tasks(user_id, task_level, level_cycle_id);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from information_schema.triggers
    where trigger_name = 'update_level_pricing_updated_at'
  ) then
    create trigger update_level_pricing_updated_at
    before update on public.level_pricing
    for each row
    execute function update_updated_at_column();
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'level_pricing' and policyname = 'Authenticated users can read level pricing'
  ) then
    create policy "Authenticated users can read level pricing"
    on public.level_pricing
    for select
    to authenticated
    using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'level_pricing' and policyname = 'Admins can manage level pricing'
  ) then
    create policy "Admins can manage level pricing"
    on public.level_pricing
    for all
    to authenticated
    using (
      exists (
        select 1
        from public.admin_users
        where public.admin_users.user_id = auth.uid()
      )
    )
    with check (
      exists (
        select 1
        from public.admin_users
        where public.admin_users.user_id = auth.uid()
      )
    );
  end if;
end $$;

create or replace function public.purchase_task_level(p_level text)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_level text := lower(coalesce(btrim(p_level), ''));
  v_price numeric;
  v_balance numeric;
  v_current_level text;
  v_highest_completed_level text;
  v_silver_cycles_completed integer;
  v_gold_cycles_completed integer;
  v_platinum_cycles_completed integer;
  v_level_task_count integer;
  v_cycle_id uuid := gen_random_uuid();
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  if v_level not in ('silver', 'gold', 'platinum') then
    raise exception 'invalid_level';
  end if;

  select count(*)
  into v_level_task_count
  from public.tasks
  where lower(coalesce(required_level, 'bronze')) = v_level;

  if v_level_task_count = 0 then
    raise exception 'level_has_no_tasks';
  end if;

  insert into public.level_progress (user_id, current_level, active_paid_level, progress_percentage, total_tasks_completed, total_artists_engaged, updated_at)
  values (auth.uid(), 'bronze', null, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select current_level, highest_completed_level, silver_cycles_completed, gold_cycles_completed, platinum_cycles_completed
  into v_current_level, v_highest_completed_level, v_silver_cycles_completed, v_gold_cycles_completed, v_platinum_cycles_completed
  from public.level_progress
  where user_id = auth.uid()
  for update;

  if v_level <> coalesce(v_current_level, 'bronze') then
    raise exception 'level_not_available_yet';
  end if;

  if exists (
    select 1
    from public.level_progress
    where user_id = auth.uid()
      and active_paid_level is not null
      and active_level_cycle_id is not null
  ) then
    raise exception 'complete_current_level_first';
  end if;

  v_highest_completed_level := coalesce(v_highest_completed_level, 'bronze');
  v_silver_cycles_completed := coalesce(v_silver_cycles_completed, 0);
  v_gold_cycles_completed := coalesce(v_gold_cycles_completed, 0);
  v_platinum_cycles_completed := coalesce(v_platinum_cycles_completed, 0);

  if v_level = 'silver' and v_silver_cycles_completed >= 3 then
    raise exception 'silver_purchase_limit_reached';
  end if;

  if v_level = 'gold' and v_silver_cycles_completed < 3 then
    raise exception 'complete_silver_three_times_first';
  end if;

  if v_level = 'gold' and v_gold_cycles_completed >= 2 then
    raise exception 'gold_purchase_limit_reached';
  end if;

  if v_level = 'platinum' and v_gold_cycles_completed < 2 then
    raise exception 'complete_gold_two_times_first';
  end if;

  select price
  into v_price
  from public.level_pricing
  where level = v_level;

  if v_price is null then
    raise exception 'pricing_not_configured';
  end if;

  select total_earnings
  into v_balance
  from public.users
  where id = auth.uid()
  for update;

  if not found then
    raise exception 'user_not_found';
  end if;

  if v_balance < v_price then
    raise exception 'insufficient_balance';
  end if;

  update public.users
  set total_earnings = total_earnings - v_price,
      updated_at = now()
  where id = auth.uid();

  update public.level_progress
  set current_level = v_level,
      active_paid_level = v_level,
      active_level_cycle_id = v_cycle_id,
      highest_completed_level = v_highest_completed_level,
      silver_cycles_completed = v_silver_cycles_completed,
      gold_cycles_completed = v_gold_cycles_completed,
      platinum_cycles_completed = v_platinum_cycles_completed,
      progress_percentage = 0,
      total_tasks_completed = 0,
      total_artists_engaged = 0,
      updated_at = now()
  where user_id = auth.uid();

  insert into public.transactions (user_id, transaction_type, amount, description, status)
  values (
    auth.uid(),
    'level_purchase',
    v_price,
    initcap(v_level) || ' level unlock purchase',
    'completed'
  );
end;
$$;

create or replace function public.complete_task(p_task_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid := auth.uid();
  v_task_level text;
  v_reward_amount numeric;
  v_reward_points integer;
  v_current_level text;
  v_cycle_id uuid;
  v_total_level_tasks integer;
  v_completed_level_tasks integer;
  v_bronze_total_tasks integer;
  v_bronze_completed_tasks integer;
  v_progress integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.level_progress (user_id, current_level, active_paid_level, progress_percentage, total_tasks_completed, total_artists_engaged, updated_at)
  values (v_user_id, 'bronze', null, 0, 0, 0, now())
  on conflict (user_id) do nothing;

  select lower(coalesce(required_level, 'bronze')), reward_amount, reward_points
  into v_task_level, v_reward_amount, v_reward_points
  from public.tasks
  where id = p_task_id;

  if not found then
    raise exception 'task_not_found';
  end if;

  select active_paid_level, active_level_cycle_id
  into v_current_level, v_cycle_id
  from public.level_progress
  where user_id = v_user_id
  for update;

  if v_task_level = 'bronze' then
    if exists (
      select 1
      from public.user_tasks
      where user_id = v_user_id
        and task_id = p_task_id
        and lower(coalesce(task_level, 'bronze')) = 'bronze'
    ) then
      raise exception 'task_already_completed';
    end if;

    insert into public.user_tasks (user_id, task_id, earned_amount, earned_points, completion_date, task_level)
    values (v_user_id, p_task_id, v_reward_amount, v_reward_points, current_date, 'bronze');

    select count(*)
    into v_bronze_total_tasks
    from public.tasks
    where lower(coalesce(required_level, 'bronze')) = 'bronze';

    select count(distinct task_id)
    into v_bronze_completed_tasks
    from public.user_tasks
    where user_id = v_user_id
      and lower(coalesce(task_level, 'bronze')) = 'bronze';

    if v_bronze_total_tasks > 0 and v_bronze_completed_tasks >= v_bronze_total_tasks then
      update public.level_progress
      set current_level = 'silver',
          updated_at = now()
      where user_id = v_user_id
        and coalesce(current_level, 'bronze') = 'bronze';
    end if;
  else
    if coalesce(v_current_level, 'bronze') <> v_task_level then
      raise exception 'level_locked';
    end if;

    if v_cycle_id is null then
      raise exception 'level_not_purchased';
    end if;

    if exists (
      select 1
      from public.user_tasks
      where user_id = v_user_id
        and task_id = p_task_id
        and level_cycle_id = v_cycle_id
    ) then
      raise exception 'task_already_completed';
    end if;

    insert into public.user_tasks (user_id, task_id, earned_amount, earned_points, completion_date, task_level, level_cycle_id)
    values (v_user_id, p_task_id, v_reward_amount, v_reward_points, current_date, v_task_level, v_cycle_id);
  end if;

  update public.users
  set total_earnings = total_earnings + v_reward_amount,
      total_points = total_points + v_reward_points,
      updated_at = now()
  where id = v_user_id;

  if v_task_level <> 'bronze' then
    select count(*)
    into v_total_level_tasks
    from public.tasks
    where lower(coalesce(required_level, 'bronze')) = v_task_level;

    select count(*)
    into v_completed_level_tasks
    from public.user_tasks
    where user_id = v_user_id
      and task_level = v_task_level
      and level_cycle_id = v_cycle_id;

    v_progress := case
      when coalesce(v_total_level_tasks, 0) = 0 then 0
      else least(100, floor((v_completed_level_tasks::numeric * 100) / v_total_level_tasks)::integer)
    end;

    if v_completed_level_tasks >= v_total_level_tasks and v_total_level_tasks > 0 then
      update public.level_progress
      set current_level = case
            when v_task_level = 'gold' and gold_cycles_completed + 1 >= 2 then 'platinum'
            when v_task_level = 'silver' and silver_cycles_completed + 1 >= 3 then 'gold'
            else current_level
          end,
          active_paid_level = null,
          active_level_cycle_id = null,
          highest_completed_level = case
            when v_task_level = 'platinum' or platinum_cycles_completed + case when v_task_level = 'platinum' then 1 else 0 end > 0 then 'platinum'
            when v_task_level = 'gold' or gold_cycles_completed + case when v_task_level = 'gold' then 1 else 0 end > 0 then 'gold'
            when v_task_level = 'silver' or silver_cycles_completed + case when v_task_level = 'silver' then 1 else 0 end > 0 then 'silver'
            else highest_completed_level
          end,
          silver_cycles_completed = silver_cycles_completed + case when v_task_level = 'silver' then 1 else 0 end,
          gold_cycles_completed = gold_cycles_completed + case when v_task_level = 'gold' then 1 else 0 end,
          platinum_cycles_completed = platinum_cycles_completed + case when v_task_level = 'platinum' then 1 else 0 end,
          progress_percentage = 0,
          total_tasks_completed = 0,
          total_artists_engaged = 0,
          updated_at = now()
      where user_id = v_user_id;
    else
      update public.level_progress
      set progress_percentage = v_progress,
          total_tasks_completed = v_completed_level_tasks,
          total_artists_engaged = v_completed_level_tasks,
          updated_at = now()
      where user_id = v_user_id;
    end if;
  end if;
end;
$$;

revoke execute on function public.purchase_task_level(text) from public;
grant execute on function public.purchase_task_level(text) to authenticated;

revoke execute on function public.complete_task(uuid) from public;
grant execute on function public.complete_task(uuid) to authenticated;

-- 19. Fix admin_users RLS recursion by using a SECURITY DEFINER helper
create or replace function public.is_admin_user()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  return exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
end;
$$;

revoke execute on function public.is_admin_user() from public;
grant execute on function public.is_admin_user() to authenticated;

drop policy if exists "Admins can manage admin users" on public.admin_users;
create policy "Admins can manage admin users"
on public.admin_users
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can read all withdrawal requests" on public.withdrawal_requests;
create policy "Admins can read all withdrawal requests"
on public.withdrawal_requests
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can update withdrawal requests" on public.withdrawal_requests;
create policy "Admins can update withdrawal requests"
on public.withdrawal_requests
for update
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can read all users" on public.users;
create policy "Admins can read all users"
on public.users
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can manage tasks" on public.tasks;
create policy "Admins can manage tasks"
on public.tasks
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can read all transactions" on public.transactions;
create policy "Admins can read all transactions"
on public.transactions
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can read all user tasks" on public.user_tasks;
create policy "Admins can read all user tasks"
on public.user_tasks
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can read all level progress" on public.level_progress;
create policy "Admins can read all level progress"
on public.level_progress
for select
to authenticated
using (public.is_admin_user());

drop policy if exists "Admins can manage artists" on public.artists;
create policy "Admins can manage artists"
on public.artists
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());

drop policy if exists "Admins can manage level pricing" on public.level_pricing;
create policy "Admins can manage level pricing"
on public.level_pricing
for all
to authenticated
using (public.is_admin_user())
with check (public.is_admin_user());
