# Backend Setup Guide

This guide will help you set up the backend for processing crypto deposits.

## Prerequisites

1. A Supabase account and project (create one at https://supabase.com)
2. Node.js and npm installed
3. Docker installed (for running Supabase locally, optional but recommended)

## Step 1: Set up your Supabase project

1. Go to https://supabase.com/dashboard and create a new project
2. Once your project is created, go to **Project Settings → API
3. Copy your:
   - Project URL
   - Anon public key
   - Service role key (keep this secret!)

## Step 2: Configure your environment variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the values with your Supabase project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

## Step 3: Run the database migrations

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```
3. Push the migrations:
   ```bash
   supabase db push
   ```

## Step 4: Deploy the edge function

1. Deploy the deposit watcher edge function:
   ```bash
   supabase functions deploy deposit-watcher
   ```
2. Set up environment variables for the edge function (in Supabase Dashboard → Edge Functions → deposit-watcher → Configuration):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Step 5: Set up blockchain API integration

The current edge function uses mock data. To make it actually work, you'll need to:

1. Choose a blockchain API provider for Bitcoin (e.g., Blockchain.com, Blockchair, BlockCypher)
2. Choose a blockchain API provider for Tron (e.g., TronScan, TronGrid)
3. Update the `checkBTCDeposits` and `checkUSDTDeposits` functions in `supabase/functions/deposit-watcher/index.ts` to use these APIs
4. Add any necessary API keys to your edge function's environment variables

## Step 6: Set up a cron job to run the deposit watcher

To automatically check for deposits, you have two options:

1. **Use Supabase Edge Functions with cron (recommended):
   - In your Supabase Dashboard, go to **Database → Cron Jobs**
   - Create a new cron job that calls your edge function every few minutes

2. **Use an external service like Vercel Cron or AWS EventBridge:
   - Set up a cron job to POST to your edge function's URL

## Step 7: Update the wallets table

The current setup uses shared deposit addresses. For better tracking, you should:

1. Generate unique deposit addresses per user (using Binance API or another service)
2. Store these addresses in the `wallets` table
3. Update the frontend to fetch and display these unique addresses

## Notes

- Always keep your service role key secret! Never expose it in frontend code.
- Make sure to enable RLS on all tables (the migration does this for you.
