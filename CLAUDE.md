# CLAUDE.md — Recipe Vault

## Before You Start

- Read DESIGN.md before writing any UI — follow strictly for colours, fonts, spacing, components
- Use Context7 for latest docs on: Next.js 16, Drizzle ORM, Neon, OpenAI Node SDK, shadcn/ui, Tailwind v4, Cloudinary

## Tech Stack

- Next.js 16 (App Router, TypeScript) — use `use cache` directive, NOT old Next.js 15 caching patterns
- Tailwind CSS v4 + shadcn/ui
- Neon (Postgres) + Drizzle ORM
- Cloudinary — photo uploads
- OpenAI GPT-4o — parse-recipe route ONLY (v1). All other pages are plain SQL.
- Recharts — insights dashboard charts

## Fonts (Google Fonts)

- Playfair Display (600, 700) — all headings, no exceptions
- DM Sans (400, 500) — body and UI
- DM Mono (600) — tier badges only

## Database Schema

`recipes`: id (uuid pk), title, source_url, source_type (tiktok|instagram|blog),
category (snacks|breakfast|lunch_dinner|desserts|drinks), tier (S|A|B|C|D|E),
review (text), photo_url, ingredients (jsonb), steps (jsonb), created_at

`tweaks`: id (uuid pk), recipe_id (fk → recipes.id cascade delete),
note (text), created_at

## Routes

- `/` — Tier board: horizontal scrollable rows S→E with recipe thumbnails
- `/recipes` — Grid, filterable by category + tier
- `/recipes/[id]` — Detail: photo, ingredients, steps, review, tweak log
- `/add` — Add recipe form + URL parser
- `/insights` — Stats dashboard (SQL only, no LLM)

## API Routes

`POST /api/parse-recipe` — { url, caption? } → fetch HTML/caption → GPT-4o → { title, ingredients[], steps[], source_type }

`POST /api/recipes/[id]/tweaks` — { note } → insert tweak row → return tweak

`DELETE /api/tweaks/[tweakId]` — delete tweak → 200

`GET /api/insights` — pure Drizzle SQL: tier counts, category counts, most tweaked (top 5), recently added (last 5) → return stats object. No LLM.

## Key UI Notes

- /add: URL input + Parse button, caption textarea (IG/TikTok only), category pills, tier badge buttons (coloured per DESIGN.md), review textarea, photo upload. No tweaks on add form.
- /recipes/[id]: tweak log is a timestamped list, newest first, "+ Add tweak" input at bottom, delete (×) per tweak
- /insights: stat cards row (total, top rated, most active category, most tweaked) + Recharts tier bar + category chart + recently added scroll row

## LLM Rules

- GPT-4o is called ONLY in /api/parse-recipe
- Do NOT add LLM calls to insights, grid, tier board, or any other route

## Build Order

1. Drizzle schema + Neon connection (`/lib/db.ts`, `/lib/schema.ts`)
2. Shared layout + sidebar (follow DESIGN.md)
3. Tier board (`/`)
4. Add form (`/add`) + `/api/parse-recipe`
5. Recipe grid (`/recipes`) + detail page (`/recipes/[id]`) + tweak API routes
6. Insights dashboard (`/insights`) + `/api/insights`
