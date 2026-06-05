-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  total_earnings numeric DEFAULT 0,
  total_points integer DEFAULT 0,
  is_vip boolean DEFAULT false,
  vip_expires_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.artists (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text,
  bio text,
  genre text,
  rating numeric DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT artists_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  artist_id uuid,
  task_type text NOT NULL,
  title text NOT NULL,
  description text,
  reward_amount numeric NOT NULL,
  reward_points integer NOT NULL,
  required_level text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);
CREATE TABLE public.user_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  completed_at timestamp without time zone DEFAULT now(),
  earned_amount numeric,
  earned_points integer,
  completion_date date DEFAULT CURRENT_DATE,
  CONSTRAINT user_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT user_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_tasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id)
);
CREATE TABLE public.interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  interaction_type text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT interactions_pkey PRIMARY KEY (id),
  CONSTRAINT interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT interactions_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES public.artists(id)
);
CREATE TABLE public.level_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_level text DEFAULT 'bronze'::text,
  progress_percentage integer DEFAULT 0,
  total_tasks_completed integer DEFAULT 0,
  total_artists_engaged integer DEFAULT 0,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT level_progress_pkey PRIMARY KEY (id),
  CONSTRAINT level_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL,
  amount numeric,
  description text,
  status text DEFAULT 'completed'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.wallets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  wallet_type text NOT NULL,
  wallet_address text,
  is_linked boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT wallets_pkey PRIMARY KEY (id),
  CONSTRAINT wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);