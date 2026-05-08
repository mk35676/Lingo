# Lingo

> 1-on-1 random video chat with live real-time translation.

## Getting started

### Prerequisites

- Node.js 18.18 or later
- npm

### Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   The `.env.local` file already exists with placeholder values. Fill in the real keys as you set up each service:

   | Variable | Where to get it |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
   | `LIVEKIT_API_KEY` | LiveKit Cloud dashboard |
   | `LIVEKIT_API_SECRET` | LiveKit Cloud dashboard |
   | `NEXT_PUBLIC_LIVEKIT_URL` | LiveKit Cloud dashboard (starts with `wss://`) |
   | `DEEPGRAM_API_KEY` | Deepgram console |
   | `DEEPL_API_KEY` | DeepL API portal |

3. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Video | LiveKit Cloud |
| Speech-to-text | Deepgram Nova-3 |
| Translation | DeepL (Google Translate fallback) |
| Database / matching | Supabase |
| Deployment | Vercel |

## Project structure

```
app/          — Next.js App Router pages and layouts
components/   — Shared React components
lib/          — Utility functions and API clients
types/        — TypeScript type definitions
```
