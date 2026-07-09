# SoundBridge

SoundBridge is a music engagement platform built with Next.js and Supabase. It combines user authentication, artist engagement tasks, level-based task progression, wallet management, deposits and withdrawals, and a separate admin dashboard for platform operations.

## Overview

The platform allows users to:

- sign up and manage their account
- complete artist engagement tasks
- progress through task levels from Bronze to Platinum
- unlock paid task levels using account balance
- manage crypto wallet addresses for withdrawals
- submit withdrawal requests for admin review

The platform also includes an admin area for:

- viewing users and user details
- managing artists
- creating, editing, and deleting tasks
- approving or rejecting withdrawals
- crediting user balances through deposits
- managing task level pricing

## Core Features

### User App

- Email/password authentication with Supabase Auth
- Email confirmation and password reset flows
- User dashboard with level progression and account balance
- Artist task system with Bronze, Silver, Gold, and Platinum levels
- Bronze tasks are free and one-time only
- Silver tasks can be purchased and completed 3 cycles
- Gold tasks can be purchased and completed 2 cycles
- Platinum tasks remain repeatable
- Wallet linking for BTC and USDT (TRC20)
- Withdrawal request flow tied to saved wallet addresses
- Deposit modal with QR/address instructions

### Admin Dashboard

- Separate admin login flow
- Admin-only route protection
- Users management view with username, email, and phone number support
- Artist management with add, edit, and delete actions
- Task management with add, edit, delete, and level assignment
- Deposit management for manually crediting user balances
- Withdrawal approval and rejection workflow
- Level pricing management
- Mobile-responsive admin navigation

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Radix UI
- Supabase Auth
- Supabase Postgres
- Supabase SSR
- Lucide React
- Vercel Analytics

## Project Structure

```text
app/
  (app)/
    account/
    artists/
    home/
    settings/
    tasks/
  admin/
    artists/
    deposits/
    login/
    settings/
    tasks/
    users/
    withdrawals/
  auth/
    callback/
    forgot-password/
    login/
    reset-password/
    sign-up/
lib/
  supabase/
supabase/
  migrations/
  update_existing_db.sql
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root.

Use one of the supported variable combinations below:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_or_anon_key
```

Alternative supported keys:

```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_KEY=your_supabase_key
```

### 3. Update the database

This project is designed to work with an existing Supabase database and includes safe update scripts for extending the current schema.

Run the main project update script in the Supabase SQL editor:

```sql
-- file: supabase/update_existing_db.sql
```

Additional SQL utilities are included in the `supabase/` folder for policy fixes and verification.

### 4. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Main Routes

### Public / Auth

- `/`
- `/auth/login`
- `/auth/sign-up`
- `/auth/forgot-password`
- `/auth/reset-password`

### User App

- `/home`
- `/artists`
- `/tasks`
- `/account`
- `/settings`

### Admin

- `/admin`
- `/admin/login`
- `/admin/users`
- `/admin/artists`
- `/admin/tasks`
- `/admin/withdrawals`
- `/admin/deposits`
- `/admin/settings`

## Level Progression Rules

- Bronze is the free entry level
- Bronze tasks can only be completed once
- Completing all Bronze tasks advances the user to Silver
- Silver tasks require payment to unlock and can be completed 3 cycles
- Completing all Silver tasks 3 times advances the user to Gold
- Gold tasks require payment to unlock and can be completed 2 cycles
- Completing all Gold tasks 2 times advances the user to Platinum
- Platinum tasks require payment to unlock and remain repeatable

## Wallets, Deposits, and Withdrawals

- Users must add valid wallet addresses before requesting withdrawals
- Admins can review withdrawal requests and approve or reject them
- Withdrawal approval deducts the user balance through database-side logic
- Admins can manually create deposits from the admin dashboard
- Deposit instructions and QR codes are shown in the user account flow

## Supabase Notes

- Route protection uses Supabase SSR session handling
- Admin authorization is based on membership in `public.admin_users`
- Row Level Security policies are used across application tables
- Sensitive balance-changing operations are handled in SQL functions

## Deployment

This app is suitable for deployment on Vercel with Supabase as the backend.

Before deploying, make sure:

- environment variables are configured in Vercel
- the required SQL updates have been applied in Supabase
- at least one admin user exists in `public.admin_users`

## Repository Notes

The project originally started from a v0-generated Next.js scaffold and has been extended into a full application with custom auth, admin, task progression, wallet, and transaction workflows.
