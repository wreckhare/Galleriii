# Galleriii

A mobile-first web app for creating beautiful galleries with 1-3 media blocks. Express yourself and showcase your aesthetic.

## Progress Status

✅ **Phase 1: Project Setup & Authentication** (Complete)
- Next.js 14+ with TypeScript and Tailwind CSS v4
- Supabase authentication ready
- Google OAuth integration
- Route protection middleware
- Landing page with auth

🔨 **Next Steps:**
- Set up Supabase project
- Build admin dashboard
- Implement media block types
- Create public gallery viewer

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in the project details:
   - Name: `galleriii` (or whatever you prefer)
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
4. Wait for the project to be created (takes ~2 minutes)

### 2. Run the Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration
6. You should see "Success. No rows returned" - this is expected!

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen if prompted
6. For Application type, select **Web application**
7. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` (replace YOUR_PROJECT_REF)
8. Copy the **Client ID** and **Client Secret**

### 4. Configure Supabase Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list and click to expand
3. Toggle **Enable Sign in with Google**
4. Paste your Google **Client ID** and **Client Secret**
5. Click **Save**

### 5. Get Your Supabase Credentials

1. In Supabase dashboard, go to **Project Settings** → **API**
2. Copy your **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy your **anon/public** key

### 6. Configure Environment Variables

1. In the `galleriii` folder, create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 7. Run the Development Server

```bash
cd galleriii
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Testing Authentication

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Continue with Google"
3. Sign in with your Google account
4. You should be redirected to `/admin` (which we'll build next!)

## Project Structure

```
galleriii/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/callback/      # OAuth callback handler
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   └── page.tsx            # Landing page
│   ├── components/
│   │   ├── auth/               # Authentication components
│   │   ├── gallery/            # Gallery components (todo)
│   │   ├── media-blocks/       # Media block components (todo)
│   │   └── ui/                 # UI components (todo)
│   ├── lib/
│   │   ├── supabase/           # Supabase clients
│   │   ├── utils/              # Utility functions
│   │   └── hooks/              # Custom React hooks (todo)
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # Database schema
└── middleware.ts               # Auth middleware
```

## Database Schema

- **users**: User profiles with username
- **galleries**: User galleries with title and visibility
- **media_blocks**: Individual media blocks (max 3 per gallery)

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Google OAuth)
- **Deployment**: Vercel (planned)

## Features

### Completed
- ✅ Landing page with Google OAuth
- ✅ User authentication
- ✅ Protected admin routes
- ✅ Database schema with RLS policies

### In Progress
- 🔨 Admin dashboard
- 🔨 Gallery creation and management
- 🔨 Media block types (Text, Image, GIF, Music, Video, Link)
- 🔨 Public gallery viewer with pull-to-refresh

## Troubleshooting

### "Invalid login credentials" error
- Make sure you've enabled Google OAuth in Supabase
- Verify your Google OAuth credentials are correct
- Check that redirect URIs match exactly

### Database errors
- Ensure the migration ran successfully
- Check that RLS policies are enabled in Supabase

### Environment variable errors
- Make sure `.env.local` exists and has the correct values
- Restart the dev server after changing environment variables

## Next Development Steps

1. Create admin dashboard page
2. Build username settings
3. Implement gallery CRUD operations
4. Create media block components
5. Build public gallery viewer
6. Add pull-to-refresh functionality
7. Deploy to Vercel

---

Built with ❤️ for creative expression
