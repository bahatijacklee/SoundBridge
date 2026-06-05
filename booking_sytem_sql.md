create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_minutes integer not null check (duration_minutes > 0),
  price numeric(10,2),
  is_active boolean not null default true,
  created_at timestamp with time zone default now()
);

create table appointments (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service_id uuid not null references services(id) on delete restrict,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp with time zone default now()
);

create table business_hours (
  id uuid primary key default gen_random_uuid(),
  weekday integer not null check (weekday between 0 and 6),
  is_open boolean not null default true,
  start_time time,
  end_time time
);

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  blocked_date date not null unique,
  reason text,
  created_at timestamp with time zone default now()
);

create table clinic_settings (
  id uuid primary key default gen_random_uuid(),
  clinic_name text not null default 'Bright Smile Dental Clinic',
  clinic_email text,
  clinic_phone text,
  clinic_address text,
  slot_interval_minutes integer not null default 30,
  booking_notice_hours integer not null default 2,
  created_at timestamp with time zone default now()
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

insert into services (name, description, duration_minutes, price)
values
  ('Dental Checkup', 'General dental examination and consultation.', 30, 40),
  ('Teeth Cleaning', 'Professional cleaning session.', 45, 60),
  ('Teeth Whitening', 'Cosmetic whitening session.', 60, 120),
  ('Tooth Filling', 'Basic tooth filling procedure.', 60, 90);

insert into business_hours (weekday, is_open, start_time, end_time)
values
  (0, false, null, null),
  (1, true, '09:00', '17:00'),
  (2, true, '09:00', '17:00'),
  (3, true, '09:00', '17:00'),
  (4, true, '09:00', '17:00'),
  (5, true, '09:00', '17:00'),
  (6, true, '09:00', '13:00');

insert into clinic_settings (clinic_name, clinic_email, clinic_phone, clinic_address, slot_interval_minutes, booking_notice_hours)
values
  ('Bright Smile Dental Clinic', 'hello@brightsmile.com', '+1 555 123 4567', '123 Main Street, New York, NY', 30, 2);

alter table admin_users enable row level security;
alter table services enable row level security;
alter table appointments enable row level security;
alter table business_hours enable row level security;
alter table blocked_dates enable row level security;
alter table clinic_settings enable row level security;

create policy "Anyone can read active services"
on services
for select
to anon, authenticated
using (is_active = true);

create policy "Admins can manage services"
on services
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

create policy "Anyone can create appointments"
on appointments
for insert
to anon, authenticated
with check (true);

create policy "Admins can read appointments"
on appointments
for select
to authenticated
using (
  exists (
    select 1
    from admin_users
    where admin_users.user_id = auth.uid()
  )
);

create policy "Admins can update appointments"
on appointments
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

create policy "Anyone can read business hours"
on business_hours
for select
to anon, authenticated
using (true);

create policy "Admins can manage business hours"
on business_hours
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

create policy "Anyone can read blocked dates"
on blocked_dates
for select
to anon, authenticated
using (true);

create policy "Admins can manage blocked dates"
on blocked_dates
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

create policy "Anyone can read clinic settings"
on clinic_settings
for select
to anon, authenticated
using (true);

create policy "Admins can manage clinic settings"
on clinic_settings
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

create policy "Users can read their own admin row"
on admin_users
for select
to authenticated
using (auth.uid() = user_id);

insert into admin_users (user_id) values ('d0cadf62-9d2c-483c-956d-9ee958ce1e3a');