# Galleriii

Mobile-first gallery app with 1-3 media blocks per gallery.

## Architecture Overview

**Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Supabase

**Data Flow:**
- Auth: Supabase Google OAuth → AuthProvider context → protected routes via middleware
- Data: User → Galleries (unlimited) → MediaBlocks (max 3 per gallery)
- Public: `/{username}` shows random visible galleries with pull-to-refresh

**Key Directories:**
```
src/
├── app/                    # Next.js pages and API routes
│   ├── [username]/        # Public gallery viewer
│   ├── admin/             # Protected dashboard, settings, gallery editor
│   ├── api/og/            # Open Graph metadata fetcher
│   └── auth/callback/     # OAuth callback
├── components/
│   ├── auth/              # AuthProvider context
│   └── media-blocks/      # Block components + BlockEditor modal
│       └── shared/        # Shared utilities (MediaErrorFallback, MediaImageLoader)
├── lib/
│   ├── supabase/          # Client/server Supabase instances
│   └── utils/             # Utilities (debounce, mediaEmbed, cn)
└── types/                 # TypeScript interfaces
```

**When Editing:**
- Media blocks: Start with `src/components/media-blocks/MediaBlock.tsx`
- Gallery editor: `src/app/admin/gallery/[id]/edit/page.tsx`
- URL utilities: `src/lib/utils/mediaEmbed.ts` (convertSpotifyUrl, convertYouTubeUrl, validateUrl)
- Block creation modal: `src/components/media-blocks/BlockEditor.tsx`

## Setup

### 1. Supabase Project
1. Create project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in SQL Editor

### 2. Google OAuth
1. Create OAuth 2.0 credentials at [Google Cloud Console](https://console.cloud.google.com/)
2. Add redirect URIs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
3. Enable Google provider in Supabase Authentication settings

### 3. Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Run
```bash
npm install
npm run dev
```

## Database Schema

| Table | Purpose |
|-------|---------|
| users | User profiles with username, display_name |
| galleries | User galleries with title, visibility, hide_title |
| media_blocks | Content blocks (max 3 per gallery) |

## Media Block Types

| Type | Component | Content |
|------|-----------|---------|
| text | TextBlock | Plain/formatted text, quotes with author |
| image | ImageBlock | URL-based images |
| gif | GifBlock | Animated GIFs |
| music | MusicBlock | Spotify embeds |
| video | VideoBlock | YouTube embeds |
| link | LinkBlock | URL + Open Graph preview |

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # ESLint check
npx playwright test  # Run E2E tests
```

## Troubleshooting

- **Auth errors**: Verify Google OAuth credentials and redirect URIs match exactly
- **Database errors**: Ensure migration ran and RLS policies are enabled
- **Env errors**: Restart dev server after changing `.env.local`
