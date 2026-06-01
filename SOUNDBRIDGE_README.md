# SoundBridge - Connecting Sound, Creating Opportunity

A Next.js 16 platform that enables fans to engage with their favorite artists by completing simple tasks and earning real rewards.

## Features

### Platform Pages
- **Landing Page** - Marketing site introducing SoundBridge
- **Home Dashboard** - Personalized welcome with user stats, level progress, trending artists, and daily tasks
- **Artists Page** - Browse all artists with follow/like actions
- **Tasks Page** - View and complete reward-earning tasks
- **Account Page** - Manage balance, wallets, and transaction history
- **Settings Page** - User preferences and profile management

### Core Features
- **Authentication** - Secure email/password signup and login via Supabase Auth
- **Level System** - Progress from Bronze → Silver → Gold → Platinum with unlocking rewards
- **Task Rewards** - Complete tasks (follow, like, read bio, buy cards) to earn USD and points
- **Artist Interactions** - Follow and like artists to support them and earn rewards
- **Progress Tracking** - Real-time updates on earnings, points, level progress, and activity
- **Wallet Management** - View linked wallets (USDT, BTC) and transaction history
- **VIP Membership** - Unlock premium rewards and exclusive benefits

## Tech Stack

- **Framework** - Next.js 16 with App Router
- **Database** - Supabase PostgreSQL
- **Authentication** - Supabase Auth
- **Styling** - Tailwind CSS v4 with custom design tokens
- **UI Components** - shadcn/ui
- **State Management** - Custom React hooks (useUser, useTasks, useArtists)
- **Client Library** - @supabase/supabase-js with SSR support

## Database Schema

### Core Tables
- `users` - User profiles with earnings and points
- `artists` - Artist information and ratings
- `tasks` - Reward tasks associated with artists
- `user_tasks` - Tracks completed tasks and earned rewards
- `interactions` - Tracks follows and likes by users
- `level_progress` - User level progression (Bronze/Silver/Gold/Platinum)
- `transactions` - Transaction history for earnings and withdrawals
- `wallets` - Linked cryptocurrency wallets

### Security
- Row Level Security (RLS) enabled on all tables
- User data isolated per authenticated user
- Automatic profile creation on signup via trigger

## Color Palette

- **Primary Brand Color** - Gold (#D4AF37)
- **Background** - Slate 950 (#030712)
- **Secondary** - Slate 900 (#0F172A)
- **Accents** - Purple and Yellow gradients
- **Text** - White with gray variants for secondary text

## File Structure

```
app/
  ├── layout.tsx                 # Root layout with dark theme
  ├── page.tsx                   # Landing page
  ├── (app)/
  │   ├── layout.tsx             # App layout with sidebar navigation
  │   ├── home/page.tsx          # Dashboard
  │   ├── artists/page.tsx       # Artist browse page
  │   ├── tasks/page.tsx         # Tasks page
  │   ├── account/page.tsx       # Account/balance page
  │   └── settings/page.tsx      # Settings page
  └── auth/
      ├── callback/route.ts      # OAuth callback handler
      ├── login/page.tsx         # Login page
      ├── sign-up/page.tsx       # Sign up page
      ├── sign-up-success/       # Post-signup confirmation
      └── error/page.tsx         # Auth error page

lib/
  └── supabase/
      ├── client.ts              # Browser client setup
      ├── server.ts              # Server client setup
      └── proxy.ts               # Session proxy for cookies

hooks/
  ├── use-user.ts                # User profile & level management
  ├── use-tasks.ts               # Task management
  └── use-artists.ts             # Artist and interaction management

middleware.ts                     # Auth middleware
```

## Getting Started

### Prerequisites
- Supabase project with PostgreSQL database
- Environment variables configured in Settings → Vars

### Installation & Running

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the landing page.

### Creating an Account

1. Click "Sign Up" on the landing page
2. Enter username, email, and password
3. You'll be redirected to sign-up success page
4. Check your email for confirmation link (may require email confirmation depending on Supabase settings)
5. Once logged in, you'll see the home dashboard

## Mock Data

The database includes:
- 10 popular artists (Lil Baby, Drake, Kendrick Lamar, etc.)
- 20 tasks (follow/like actions for each artist)
- Sample genre and rating data

## Next Steps to Enhance

1. **Add real artist connections** - Link to Spotify or Apple Music APIs
2. **Implement payment processing** - Connect Stripe for real transactions
3. **Add notification system** - Email/push notifications for task completions
4. **Create admin dashboard** - Manage artists, tasks, and rewards
5. **Implement referral system** - Earn bonuses for inviting friends
6. **Add content moderation** - Review user-generated comments/posts
7. **Analytics** - Track user engagement and earnings metrics
8. **Mobile app** - React Native version of the platform

## Architecture Notes

- **Authentication Flow** - Email verification required (set in Supabase settings)
- **RLS Policies** - Data is protected at the database level
- **Real-time Updates** - Ready for Supabase real-time subscriptions
- **Responsive Design** - Mobile-first approach with Tailwind breakpoints
- **Performance** - Uses React Server Components and client-side hooks efficiently

## Support

For issues or questions, contact customer@soundbridge.com
