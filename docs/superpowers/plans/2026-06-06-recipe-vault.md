# Recipe Vault Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal recipe tier-board app where the user saves, ranks, and reviews recipes from TikTok, Instagram, and food blogs.

**Architecture:** Next.js 16 App Router with server components for data-fetching pages (`use cache`) and client components for interactive forms and charts. Neon Postgres via Drizzle ORM for all data; OpenAI GPT-4o only in the parse-recipe route; Recharts for the insights dashboard.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Neon + Drizzle ORM 0.45, Cloudinary (next-cloudinary), OpenAI Node SDK, Recharts, Jest + ts-jest

---

## File Map

```
lib/
  db.ts                         ← Neon + Drizzle connection
  schema.ts                     ← recipes + tweaks tables, enums, inferred types
  source-detection.ts           ← pure fn: URL → source_type (testable)

drizzle.config.ts               ← drizzle-kit config
jest.config.ts                  ← jest + ts-jest config
__tests__/
  source-detection.test.ts      ← unit tests for source type detection

app/
  globals.css                   ← MODIFY: replace with design tokens + font vars
  layout.tsx                    ← MODIFY: Google fonts, sidebar shell
  page.tsx                      ← MODIFY: tier board (server, use cache)
  add/
    page.tsx                    ← add recipe form (client)
  recipes/
    page.tsx                    ← recipe grid (server, use cache)
    [id]/
      page.tsx                  ← recipe detail (server + client island)
  insights/
    page.tsx                    ← insights dashboard (client, fetches on mount)
  api/
    parse-recipe/route.ts       ← POST: URL → GPT-4o → structured recipe
    recipes/
      route.ts                  ← POST: save new recipe to DB
      [id]/
        route.ts                ← PATCH (update review) + DELETE (delete recipe)
        tweaks/route.ts         ← POST: add tweak
    tweaks/
      [tweakId]/route.ts        ← DELETE: remove tweak
    insights/route.ts           ← GET: SQL aggregations → stats object

components/
  sidebar.tsx                   ← nav sidebar (client, usePathname)
  tier-badge.tsx                ← tier pill badge + TIER_CONFIG constant
  recipe-photo-card.tsx         ← compact 120px card for tier board
  recipe-card.tsx               ← full card for recipe grid
  tweak-log.tsx                 ← tweak list + add/delete (client)
  insights-charts.tsx           ← Recharts tier bar + category bar (client)
```

---

## Task 1: Install Dependencies + Database Schema

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `jest.config.ts`
- Create: `lib/db.ts`
- Create: `lib/schema.ts`
- Create: `lib/source-detection.ts`
- Create: `__tests__/source-detection.test.ts`

- [ ] **Step 1: Install missing dependencies**

```bash
cd /workspace/recipe-vault
npm install recharts
npm install --save-dev drizzle-kit jest @types/jest ts-jest
```

Expected: packages added to node_modules with no peer-dep errors.

- [ ] **Step 2: Add DB and test scripts to package.json**

Open `package.json` and replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "test": "jest"
},
```

- [ ] **Step 3: Create drizzle.config.ts**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 4: Create jest.config.ts**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

export default config
```

- [ ] **Step 5: Create lib/source-detection.ts**

```typescript
export type SourceType = 'tiktok' | 'instagram' | 'blog'

export function detectSourceType(url: string): SourceType {
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  return 'blog'
}
```

- [ ] **Step 6: Write the failing test**

Create `__tests__/source-detection.test.ts`:

```typescript
import { detectSourceType } from '@/lib/source-detection'

describe('detectSourceType', () => {
  it('returns tiktok for tiktok.com URLs', () => {
    expect(detectSourceType('https://www.tiktok.com/@chef/video/123')).toBe('tiktok')
  })

  it('returns instagram for instagram.com URLs', () => {
    expect(detectSourceType('https://www.instagram.com/reel/abc123')).toBe('instagram')
  })

  it('returns blog for any other domain', () => {
    expect(detectSourceType('https://halfbakedharvest.com/pasta')).toBe('blog')
  })

  it('returns blog for youtube.com', () => {
    expect(detectSourceType('https://youtube.com/watch?v=abc')).toBe('blog')
  })
})
```

- [ ] **Step 7: Run test — expect FAIL (module not found)**

```bash
npx jest --testPathPattern=source-detection
```

Expected: FAIL — `Cannot find module '@/lib/source-detection'`

- [ ] **Step 8: Run test again — expect PASS (file now exists)**

```bash
npx jest --testPathPattern=source-detection
```

Expected: PASS — 4 tests pass.

- [ ] **Step 9: Create lib/schema.ts**

```typescript
import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const sourceTypeEnum = pgEnum('source_type', ['tiktok', 'instagram', 'blog'])
export const categoryEnum = pgEnum('category', ['snacks', 'breakfast', 'lunch_dinner', 'desserts', 'drinks'])
export const tierEnum = pgEnum('tier', ['S', 'A', 'B', 'C', 'D', 'E'])

export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  sourceUrl: text('source_url'),
  sourceType: sourceTypeEnum('source_type'),
  category: categoryEnum('category'),
  tier: tierEnum('tier'),
  review: text('review'),
  photoUrl: text('photo_url'),
  ingredients: jsonb('ingredients').$type<string[]>().default([]),
  steps: jsonb('steps').$type<string[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tweaks = pgTable('tweaks', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type Recipe = typeof recipes.$inferSelect
export type NewRecipe = typeof recipes.$inferInsert
export type Tweak = typeof tweaks.$inferSelect
export type NewTweak = typeof tweaks.$inferInsert
```

- [ ] **Step 10: Create lib/db.ts**

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
```

- [ ] **Step 11: Push schema to Neon**

```bash
npm run db:push
```

Expected output: `[✓] Changes applied` — tables `recipes`, `tweaks`, and the 3 enums created in Neon.

- [ ] **Step 12: Commit**

```bash
git add lib/db.ts lib/schema.ts lib/source-detection.ts drizzle.config.ts jest.config.ts __tests__/source-detection.test.ts package.json package-lock.json
git commit -m "feat: database schema, Drizzle connection, source detection utility"
```

---

## Task 2: Design Tokens + Fonts + Layout + Sidebar

**Files:**
- Modify: `app/globals.css`
- Modify: `next.config.ts`
- Modify: `app/layout.tsx`
- Create: `components/sidebar.tsx`

- [ ] **Step 1: Update next.config.ts to enable `use cache`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    dynamicIO: true,
  },
}

export default nextConfig
```

- [ ] **Step 2: Replace app/globals.css with design tokens**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-playfair: var(--font-playfair);
  --font-dm-sans: var(--font-dm-sans);
  --font-dm-mono: var(--font-dm-mono);
}

:root {
  --color-bg: #FDFAF5;
  --color-surface: #FFF8EE;
  --color-surface-raised: #FFFFFF;
  --color-primary: #C17F3E;
  --color-primary-hover: #A86A2C;
  --color-primary-light: #E8C99A;
  --color-text-primary: #2C1A0E;
  --color-text-muted: #8C6A4F;
  --color-border: #EDE0CE;
  --color-border-strong: #D4C0A8;
  --color-success: #6A9E5B;
  --color-error: #C0523A;
  --tier-s: #D4A017;
  --tier-a: #C17F3E;
  --tier-b: #8FAF6E;
  --tier-c: #A0B4C8;
  --tier-d: #C8A8B8;
  --tier-e: #B0A89E;
}

@layer base {
  * {
    box-sizing: border-box;
  }
  body {
    background-color: var(--color-bg);
    color: var(--color-text-primary);
    font-family: var(--font-dm-sans), system-ui, sans-serif;
    line-height: 1.6;
    font-size: 0.9375rem;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-playfair), Georgia, serif;
    line-height: 1.2;
    color: var(--color-text-primary);
  }
  input, textarea, select {
    font-family: var(--font-dm-sans), system-ui, sans-serif;
  }
}
```

- [ ] **Step 3: Update app/layout.tsx with fonts and sidebar shell**

```typescript
import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans, DM_Mono } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/sidebar'

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-sans',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  title: 'Recipe Vault',
  description: 'Your personal recipe tier board',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body style={{ minHeight: '100vh', display: 'flex', margin: 0 }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, padding: '48px 48px', overflowY: 'auto' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Create components/sidebar.tsx**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',          label: 'Tier Board',   emoji: '🏆' },
  { href: '/recipes',   label: 'All Recipes',  emoji: '📋' },
  { href: '/add',       label: 'Add Recipe',   emoji: '➕' },
  { href: '/insights',  label: 'Insights',     emoji: '📊' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
      height: '100vh',
    }}>
      <div style={{ padding: '0 20px 32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          fontWeight: 700,
          fontSize: '1.375rem',
          color: 'var(--color-primary)',
          margin: 0,
        }}>
          Recipe Vault
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          personal tier board
        </p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px', flex: 1 }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none',
                color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
                background: active ? 'var(--color-primary-light)' : 'transparent',
                borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 5: Verify dev server starts without errors**

```bash
npm run dev
```

Expected: server starts, `http://localhost:3000` loads with sidebar visible, warm background, Playfair Display font on any heading.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/layout.tsx next.config.ts components/sidebar.tsx
git commit -m "feat: design tokens, Google fonts, sidebar navigation"
```

---

## Task 3: Tier Board (/)

**Files:**
- Create: `components/tier-badge.tsx`
- Create: `components/recipe-photo-card.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Create components/tier-badge.tsx**

```typescript
export const TIER_CONFIG = {
  S: '#D4A017',
  A: '#C17F3E',
  B: '#8FAF6E',
  C: '#A0B4C8',
  D: '#C8A8B8',
  E: '#B0A89E',
} as const

export type Tier = keyof typeof TIER_CONFIG

interface Props {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { fontSize: '0.75rem', padding: '2px 8px' },
  md: { fontSize: '0.875rem', padding: '4px 10px' },
  lg: { fontSize: '1rem', padding: '6px 14px' },
}

export function TierBadge({ tier, size = 'md' }: Props) {
  return (
    <span style={{
      fontFamily: 'var(--font-dm-mono)',
      fontWeight: 600,
      ...SIZES[size],
      borderRadius: 999,
      background: TIER_CONFIG[tier],
      color: '#fff',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display: 'inline-block',
      lineHeight: 1.4,
    }}>
      {tier}
    </span>
  )
}
```

- [ ] **Step 2: Create components/recipe-photo-card.tsx**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/lib/schema'
import { TierBadge } from './tier-badge'

type Props = {
  recipe: Pick<Recipe, 'id' | 'title' | 'photoUrl' | 'tier'>
}

export function RecipePhotoCard({ recipe }: Props) {
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      style={{
        display: 'block',
        width: 120,
        flexShrink: 0,
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--color-surface-raised)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 8px rgba(44,26,14,0.06)',
        textDecoration: 'none',
        position: 'relative',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(44,26,14,0.10)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLElement).style.transform = ''
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(44,26,14,0.06)'
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4' }}>
        {recipe.photoUrl ? (
          <Image src={recipe.photoUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} sizes="120px" />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            background: 'var(--color-primary-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem',
          }}>🍽️</div>
        )}
        {recipe.tier && (
          <div style={{ position: 'absolute', top: 4, right: 4 }}>
            <TierBadge tier={recipe.tier} size="sm" />
          </div>
        )}
      </div>
      <div style={{ padding: '6px 8px 8px' }}>
        <p style={{
          fontFamily: 'var(--font-playfair)',
          fontWeight: 600,
          fontSize: '0.725rem',
          color: 'var(--color-text-primary)',
          margin: 0,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {recipe.title}
        </p>
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Replace app/page.tsx with tier board**

```typescript
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { RecipePhotoCard } from '@/components/recipe-photo-card'
import { TIER_CONFIG, type Tier } from '@/components/tier-badge'

const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'E']

async function getRecipes() {
  'use cache'
  return db.select({
    id: recipes.id,
    title: recipes.title,
    photoUrl: recipes.photoUrl,
    tier: recipes.tier,
  }).from(recipes)
}

export default async function TierBoardPage() {
  const all = await getRecipes()
  const byTier = Object.fromEntries(
    TIERS.map(t => [t, all.filter(r => r.tier === t)])
  ) as Record<Tier, typeof all>

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2.5rem', marginBottom: 32 }}>
        Tier Board
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TIERS.map(tier => (
          <div key={tier} style={{
            display: 'flex',
            alignItems: 'stretch',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 16,
            overflow: 'hidden',
            minHeight: 96,
          }}>
            <div style={{
              width: 48,
              flexShrink: 0,
              background: `${TIER_CONFIG[tier]}26`,
              borderRight: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-dm-mono)',
                fontWeight: 600,
                fontSize: '1.125rem',
                color: TIER_CONFIG[tier],
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                {tier}
              </span>
            </div>
            <div style={{
              display: 'flex',
              gap: 12,
              padding: '12px 16px',
              overflowX: 'auto',
              flex: 1,
              alignItems: 'center',
              scrollbarWidth: 'none',
            }}>
              {byTier[tier].length === 0 ? (
                <p style={{
                  color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '0.875rem',
                  fontStyle: 'italic',
                  margin: 0,
                }}>
                  No recipes yet
                </p>
              ) : (
                byTier[tier].map(r => <RecipePhotoCard key={r.id} recipe={r} />)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Check dev server renders tier board**

Open `http://localhost:3000` — expect 6 tier rows (S–E), each showing "No recipes yet" until data exists.

- [ ] **Step 5: Commit**

```bash
git add components/tier-badge.tsx components/recipe-photo-card.tsx app/page.tsx
git commit -m "feat: tier board page with scrollable tier rows"
```

---

## Task 4: Add Recipe Form + /api/parse-recipe + /api/recipes

**Files:**
- Create: `app/api/parse-recipe/route.ts`
- Create: `app/api/recipes/route.ts`
- Create: `app/add/page.tsx`

- [ ] **Step 1: Create app/api/parse-recipe/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { detectSourceType } from '@/lib/source-detection'

const openai = new OpenAI()

export async function POST(request: NextRequest) {
  const { url, caption } = await request.json() as { url: string; caption?: string }

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const sourceType = detectSourceType(url)
  let pageText = caption ?? ''

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeVault/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    if (sourceType === 'blog') {
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000)
    } else if (!caption) {
      pageText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
    }
  } catch {
    // continue with caption if fetch fails
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a recipe parser. Extract the recipe and return ONLY valid JSON: { "title": string, "ingredients": string[], "steps": string[] }. No markdown.',
      },
      {
        role: 'user',
        content: `Source: ${sourceType}\nURL: ${url}\n\n${pageText}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  return NextResponse.json({ ...parsed, source_type: sourceType })
}
```

- [ ] **Step 2: Create app/api/recipes/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import type { NewRecipe } from '@/lib/schema'

export async function POST(request: NextRequest) {
  const body = await request.json() as NewRecipe
  const [recipe] = await db.insert(recipes).values(body).returning()
  return NextResponse.json(recipe, { status: 201 })
}
```

- [ ] **Step 3: Create app/add/page.tsx**

```typescript
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CldUploadWidget } from 'next-cloudinary'
import { TierBadge, type Tier } from '@/components/tier-badge'
import { detectSourceType } from '@/lib/source-detection'

const CATEGORIES = [
  { value: 'snacks',       label: 'Snacks' },
  { value: 'breakfast',    label: 'Breakfast' },
  { value: 'lunch_dinner', label: 'Lunch & Dinner' },
  { value: 'desserts',     label: 'Desserts' },
  { value: 'drinks',       label: 'Drinks' },
] as const

type Category = typeof CATEGORIES[number]['value']
const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'E']

export default function AddRecipePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [url, setUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [sourceType, setSourceType] = useState<string>('blog')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category | null>(null)
  const [tier, setTier] = useState<Tier | null>(null)
  const [review, setReview] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [ingredients, setIngredients] = useState<string[]>([])
  const [steps, setSteps] = useState<string[]>([])
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState('')

  const isSocial = sourceType === 'tiktok' || sourceType === 'instagram'

  function handleUrlChange(val: string) {
    setUrl(val)
    if (val) setSourceType(detectSourceType(val))
  }

  async function handleParse() {
    if (!url) return
    setParsing(true)
    setError('')
    try {
      const res = await fetch('/api/parse-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, caption: isSocial ? caption : undefined }),
      })
      const data = await res.json()
      if (data.title) setTitle(data.title)
      if (data.ingredients?.length) setIngredients(data.ingredients)
      if (data.steps?.length) setSteps(data.steps)
      if (data.source_type) setSourceType(data.source_type)
    } catch {
      setError('Could not parse recipe — fill in manually.')
    } finally {
      setParsing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !category || !tier) {
      setError('Title, category, and tier are required.')
      return
    }
    startTransition(async () => {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sourceUrl: url || null, sourceType, category, tier, review: review || null, photoUrl: photoUrl || null, ingredients, steps }),
      })
      if (res.ok) {
        const recipe = await res.json()
        router.push(`/recipes/${recipe.id}`)
      } else {
        setError('Failed to save recipe.')
      }
    })
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2rem', marginBottom: 32 }}>
        Add Recipe
      </h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* URL + Parse button */}
        <div>
          <label style={S.label}>Recipe URL</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="url" value={url} onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://…" style={{ ...S.input, flex: 1 }} />
            <button type="button" onClick={handleParse} disabled={!url || parsing} style={S.btnPrimary}>
              {parsing ? 'Parsing…' : 'Parse'}
            </button>
          </div>
        </div>

        {/* Caption — shown for social URLs */}
        {isSocial && (
          <div>
            <label style={S.label}>Caption</label>
            <textarea value={caption} onChange={e => setCaption(e.target.value)}
              placeholder="Paste TikTok / Instagram caption here…"
              rows={3} style={{ ...S.input, resize: 'vertical' }} />
          </div>
        )}

        {/* Source badge */}
        {url && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={S.label}>Source:</span>
            <span style={S.chip}>{sourceType}</span>
          </div>
        )}

        {/* Title */}
        <div>
          <label style={S.label}>Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Recipe name" required style={S.input} />
        </div>

        {/* Category pills */}
        <div>
          <label style={S.label}>Category *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
                ...S.chip,
                cursor: 'pointer',
                border: category === c.value ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '6px 14px',
                fontSize: '0.875rem',
                background: category === c.value ? 'var(--color-primary-light)' : 'var(--color-surface)',
              }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tier buttons */}
        <div>
          <label style={S.label}>Tier *</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TIERS.map(t => (
              <button key={t} type="button" onClick={() => setTier(t)} style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 2,
                outline: tier === t ? '3px solid var(--color-text-primary)' : '3px solid transparent',
                borderRadius: 999,
              }}>
                <TierBadge tier={t} size="lg" />
              </button>
            ))}
          </div>
        </div>

        {/* Review */}
        <div>
          <label style={S.label}>Your Review</label>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="Overall impression after cooking…" rows={3}
            style={{ ...S.input, resize: 'vertical' }} />
        </div>

        {/* Photo upload */}
        <div>
          <label style={S.label}>Photo</label>
          <CldUploadWidget uploadPreset="recipe_vault"
            onSuccess={result => {
              if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
                setPhotoUrl(result.info.secure_url as string)
              }
            }}>
            {({ open }) => (
              <div>
                <button type="button" onClick={() => open()} style={S.btnSecondary}>
                  {photoUrl ? 'Change Photo' : 'Upload Photo'}
                </button>
                {photoUrl && (
                  <img src={photoUrl} alt="Preview"
                    style={{ display: 'block', marginTop: 8, borderRadius: 12, maxWidth: 300, width: '100%' }} />
                )}
              </div>
            )}
          </CldUploadWidget>
        </div>

        {/* Parsed ingredients */}
        {ingredients.length > 0 && (
          <div>
            <label style={S.label}>Ingredients (parsed)</label>
            <ul style={{ paddingLeft: 20, color: 'var(--color-text-muted)', margin: 0 }}>
              {ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
        )}

        {/* Parsed steps */}
        {steps.length > 0 && (
          <div>
            <label style={S.label}>Steps (parsed)</label>
            <ol style={{ paddingLeft: 20, color: 'var(--color-text-muted)', margin: 0 }}>
              {steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        )}

        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        <button type="submit" disabled={isPending} style={{ ...S.btnPrimary, justifyContent: 'center', width: '100%' }}>
          {isPending ? 'Saving…' : 'Save Recipe'}
        </button>
      </form>
    </div>
  )
}

const S = {
  label: {
    display: 'block',
    fontFamily: 'var(--font-dm-sans)',
    fontWeight: 500,
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1.5px solid var(--color-border-strong)',
    borderRadius: 10,
    background: 'var(--color-surface-raised)',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '0.9375rem',
    color: 'var(--color-text-primary)',
    outline: 'none',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 20px',
    background: 'var(--color-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 20px',
    background: 'transparent',
    color: 'var(--color-text-primary)',
    border: '1.5px solid var(--color-border-strong)',
    borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)',
    fontWeight: 500,
    fontSize: '0.875rem',
    cursor: 'pointer',
  } as React.CSSProperties,
  chip: {
    padding: '4px 10px',
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary-hover)',
    borderRadius: 999,
    fontFamily: 'var(--font-dm-sans)',
    fontWeight: 500,
    fontSize: '0.75rem',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  } as React.CSSProperties,
}
```

- [ ] **Step 4: Verify add page loads and Parse button calls the API**

Start dev server. Navigate to `http://localhost:3000/add`. Check:
- URL field + Parse button visible
- Caption textarea appears when URL contains "tiktok.com" or "instagram.com"
- Tier badge buttons render in gold/caramel/green/blue/mauve/grey
- Category pills render and toggle selection

- [ ] **Step 5: Commit**

```bash
git add app/api/parse-recipe/route.ts app/api/recipes/route.ts app/add/page.tsx
git commit -m "feat: add recipe form, parse-recipe API, save recipe API"
```

---

## Task 5: Recipe Grid + Detail Page + Tweak APIs

**Files:**
- Create: `components/recipe-card.tsx`
- Create: `app/recipes/page.tsx`
- Create: `app/api/recipes/[id]/route.ts`
- Create: `app/api/recipes/[id]/tweaks/route.ts`
- Create: `app/api/tweaks/[tweakId]/route.ts`
- Create: `components/tweak-log.tsx`
- Create: `app/recipes/[id]/page.tsx`

- [ ] **Step 1: Create components/recipe-card.tsx**

```typescript
import Image from 'next/image'
import Link from 'next/link'
import type { Recipe } from '@/lib/schema'
import { TierBadge } from './tier-badge'

const SOURCE_ICON: Record<string, string> = {
  tiktok: '🎵',
  instagram: '📸',
  blog: '📝',
}

const CATEGORY_LABEL: Record<string, string> = {
  snacks: 'Snacks',
  breakfast: 'Breakfast',
  lunch_dinner: 'Lunch & Dinner',
  desserts: 'Desserts',
  drinks: 'Drinks',
}

type Props = {
  recipe: Pick<Recipe, 'id' | 'title' | 'photoUrl' | 'tier' | 'category' | 'sourceType' | 'createdAt'>
}

export function RecipeCard({ recipe }: Props) {
  return (
    <Link href={`/recipes/${recipe.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(44,26,14,0.06)',
        transition: 'transform 200ms ease, box-shadow 200ms ease',
        cursor: 'pointer',
      }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(44,26,14,0.10)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.transform = ''
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(44,26,14,0.06)'
        }}
      >
        {/* Photo */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--color-primary-light)' }}>
          {recipe.photoUrl ? (
            <Image src={recipe.photoUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              🍽️
            </div>
          )}
          {/* Tier badge top-right */}
          {recipe.tier && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <TierBadge tier={recipe.tier} />
            </div>
          )}
          {/* Category chip top-left */}
          {recipe.category && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '3px 8px', borderRadius: 999,
              background: 'var(--color-surface-raised)',
              fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
              fontSize: '0.7rem', color: 'var(--color-text-muted)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {CATEGORY_LABEL[recipe.category]}
            </div>
          )}
        </div>
        {/* Card body */}
        <div style={{ padding: '14px 16px' }}>
          <h3 style={{
            fontFamily: 'var(--font-playfair)', fontWeight: 600,
            fontSize: '1.125rem', margin: '0 0 8px',
            color: 'var(--color-text-primary)',
          }}>
            {recipe.title}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1rem' }}>
              {recipe.sourceType ? SOURCE_ICON[recipe.sourceType] : SOURCE_ICON.blog}
            </span>
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create app/recipes/page.tsx**

```typescript
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { RecipeCard } from '@/components/recipe-card'
import type { Recipe } from '@/lib/schema'

async function getAllRecipes() {
  'use cache'
  return db.select({
    id: recipes.id,
    title: recipes.title,
    photoUrl: recipes.photoUrl,
    tier: recipes.tier,
    category: recipes.category,
    sourceType: recipes.sourceType,
    createdAt: recipes.createdAt,
  }).from(recipes).orderBy(desc(recipes.createdAt))
}

export default async function RecipesPage() {
  const all = await getAllRecipes()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2.5rem', margin: 0 }}>
          All Recipes
        </h1>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          {all.length} recipe{all.length !== 1 ? 's' : ''}
        </span>
      </div>
      {all.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 0',
          color: 'var(--color-text-muted)', fontFamily: 'var(--font-dm-sans)',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🍽️</div>
          <p>No recipes yet. <a href="/add" style={{ color: 'var(--color-primary)' }}>Add your first one.</a></p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {all.map(r => <RecipeCard key={r.id} recipe={r as Pick<Recipe, 'id' | 'title' | 'photoUrl' | 'tier' | 'category' | 'sourceType' | 'createdAt'>} />)}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create app/api/recipes/[id]/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(recipes).set(body).where(eq(recipes.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(recipes).where(eq(recipes.id, id))
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 4: Create app/api/recipes/[id]/tweaks/route.ts**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tweaks } from '@/lib/schema'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await params
  const { note } = await request.json() as { note: string }
  if (!note?.trim()) return NextResponse.json({ error: 'note required' }, { status: 400 })
  const [tweak] = await db.insert(tweaks).values({ recipeId, note: note.trim() }).returning()
  return NextResponse.json(tweak, { status: 201 })
}
```

- [ ] **Step 5: Create app/api/tweaks/[tweakId]/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tweaks } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(_request: Request, { params }: { params: Promise<{ tweakId: string }> }) {
  const { tweakId } = await params
  await db.delete(tweaks).where(eq(tweaks.id, tweakId))
  return new NextResponse(null, { status: 204 })
}
```

- [ ] **Step 6: Create components/tweak-log.tsx**

```typescript
'use client'
import { useState } from 'react'
import type { Tweak } from '@/lib/schema'

interface Props {
  recipeId: string
  initial: Tweak[]
}

export function TweakLog({ recipeId, initial }: Props) {
  const [tweakList, setTweakList] = useState<Tweak[]>(initial)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addTweak() {
    if (!note.trim()) return
    setSaving(true)
    const res = await fetch(`/api/recipes/${recipeId}/tweaks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    if (res.ok) {
      const tweak = await res.json()
      setTweakList(prev => [tweak, ...prev])
      setNote('')
    }
    setSaving(false)
  }

  async function deleteTweak(id: string) {
    await fetch(`/api/tweaks/${id}`, { method: 'DELETE' })
    setTweakList(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.5rem', marginBottom: 16 }}>
        Tweak Log
      </h2>

      {/* Add input */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTweak()}
          placeholder="+ Add tweak — e.g. use oat flour instead"
          style={{
            flex: 1, padding: '10px 14px',
            border: '1.5px solid var(--color-border-strong)',
            borderRadius: 10, background: 'var(--color-surface-raised)',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.9375rem',
            color: 'var(--color-text-primary)', outline: 'none',
          }}
        />
        <button
          onClick={addTweak} disabled={saving || !note.trim()}
          style={{
            padding: '10px 16px', background: 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>

      {/* Tweak list */}
      {tweakList.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>
          No tweaks yet — cook it and see what you'd change.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tweakList.map(t => (
            <li key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              padding: '10px 14px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10,
            }}>
              <div>
                <p style={{ margin: 0, fontFamily: 'var(--font-dm-sans)', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                  {t.note}
                </p>
                <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-dm-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => deleteTweak(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '1rem',
                  padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                }}
                aria-label="Delete tweak"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Create app/recipes/[id]/page.tsx**

```typescript
import { db } from '@/lib/db'
import { recipes, tweaks } from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { TierBadge } from '@/components/tier-badge'
import { TweakLog } from '@/components/tweak-log'

const CATEGORY_LABEL: Record<string, string> = {
  snacks: 'Snacks', breakfast: 'Breakfast',
  lunch_dinner: 'Lunch & Dinner', desserts: 'Desserts', drinks: 'Drinks',
}
const SOURCE_ICON: Record<string, string> = { tiktok: '🎵', instagram: '📸', blog: '📝' }

async function getRecipe(id: string) {
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
  return recipe ?? null
}

async function getRecipeTweaks(recipeId: string) {
  return db.select().from(tweaks).where(eq(tweaks.recipeId, recipeId)).orderBy(desc(tweaks.createdAt))
}

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [recipe, recipeTweaks] = await Promise.all([getRecipe(id), getRecipeTweaks(id)])
  if (!recipe) notFound()

  async function deleteRecipe() {
    'use server'
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/recipes/${id}`, { method: 'DELETE' })
    redirect('/recipes')
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Back link */}
      <Link href="/recipes" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        ← All Recipes
      </Link>

      {/* Hero photo */}
      {recipe.photoUrl && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
          <Image src={recipe.photoUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} sizes="800px" priority />
        </div>
      )}

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2.5rem', margin: 0 }}>
            {recipe.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
            {recipe.tier && <TierBadge tier={recipe.tier} />}
            {recipe.category && (
              <span style={{
                padding: '4px 10px', borderRadius: 999,
                background: 'var(--color-primary-light)', color: 'var(--color-primary-hover)',
                fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
                fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {CATEGORY_LABEL[recipe.category]}
              </span>
            )}
            {recipe.sourceType && <span style={{ fontSize: '1.25rem' }}>{SOURCE_ICON[recipe.sourceType]}</span>}
            {recipe.sourceUrl && (
              <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>
                Source ↗
              </a>
            )}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link href={`/recipes/${id}/edit`} style={{
            padding: '8px 16px', borderRadius: 10,
            border: '1.5px solid var(--color-border-strong)', background: 'transparent',
            fontFamily: 'var(--font-dm-sans)', fontWeight: 500, fontSize: '0.875rem',
            color: 'var(--color-text-primary)', textDecoration: 'none',
          }}>
            Edit
          </Link>
          <form action={deleteRecipe}>
            <button type="submit" style={{
              padding: '8px 16px', borderRadius: 10,
              background: '#FFF0ED', color: 'var(--color-error)',
              border: '1px solid #F0C4BA',
              fontFamily: 'var(--font-dm-sans)', fontWeight: 500, fontSize: '0.875rem',
              cursor: 'pointer',
            }}>
              Delete
            </button>
          </form>
        </div>
      </div>

      {/* Review */}
      {recipe.review && (
        <div style={{
          padding: '16px 20px', borderRadius: 12,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          marginBottom: 32,
        }}>
          <p style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1rem', marginBottom: 6, color: 'var(--color-text-muted)' }}>
            Your Review
          </p>
          <p style={{ fontFamily: 'var(--font-dm-sans)', margin: 0, lineHeight: 1.7, color: 'var(--color-text-primary)' }}>
            {recipe.review}
          </p>
        </div>
      )}

      {/* Ingredients */}
      {recipe.ingredients && (recipe.ingredients as string[]).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.5rem', marginBottom: 12 }}>Ingredients</h2>
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(recipe.ingredients as string[]).map((ing, i) => (
              <li key={i} style={{ fontFamily: 'var(--font-dm-sans)', color: 'var(--color-text-primary)' }}>{ing}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Steps */}
      {recipe.steps && (recipe.steps as string[]).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.5rem', marginBottom: 12 }}>Steps</h2>
          <ol style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(recipe.steps as string[]).map((step, i) => (
              <li key={i} style={{ fontFamily: 'var(--font-dm-sans)', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>{step}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Tweak Log */}
      <div style={{
        paddingTop: 32,
        borderTop: '1px solid var(--color-border)',
        marginTop: 32,
      }}>
        <TweakLog recipeId={recipe.id} initial={recipeTweaks} />
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Verify recipe detail renders**

Navigate to `http://localhost:3000/recipes` — empty state shown. Add a recipe via `/add`, verify you're redirected to the detail page. Check: photo hero, title, tier badge, ingredients, steps, tweak log with empty state, add tweak input.

- [ ] **Step 9: Commit**

```bash
git add components/recipe-card.tsx components/tweak-log.tsx \
  app/recipes/page.tsx app/recipes/\[id\]/page.tsx \
  app/api/recipes/\[id\]/route.ts app/api/recipes/\[id\]/tweaks/route.ts \
  app/api/tweaks/\[tweakId\]/route.ts
git commit -m "feat: recipe grid, detail page, tweak log with add/delete"
```

---

## Task 6: Insights Dashboard + /api/insights

**Files:**
- Create: `app/api/insights/route.ts`
- Create: `components/insights-charts.tsx`
- Create: `app/insights/page.tsx`

- [ ] **Step 1: Create app/api/insights/route.ts**

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes, tweaks } from '@/lib/schema'
import { desc, count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [tierRows, categoryRows, mostTweakedRows, recentRows] = await Promise.all([
    db.select({ tier: recipes.tier, count: count() }).from(recipes).groupBy(recipes.tier),
    db.select({ category: recipes.category, count: count() }).from(recipes).groupBy(recipes.category),
    db.select({
        id: recipes.id,
        title: recipes.title,
        tier: recipes.tier,
        tweakCount: count(tweaks.id),
      })
      .from(recipes)
      .leftJoin(tweaks, eq(tweaks.recipeId, recipes.id))
      .groupBy(recipes.id, recipes.title, recipes.tier)
      .orderBy(desc(count(tweaks.id)))
      .limit(5),
    db.select({
        id: recipes.id,
        title: recipes.title,
        tier: recipes.tier,
        category: recipes.category,
        photoUrl: recipes.photoUrl,
        createdAt: recipes.createdAt,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(5),
  ])

  const total = tierRows.reduce((s, r) => s + Number(r.count), 0)
  const topRated = Number(tierRows.find(r => r.tier === 'S')?.count ?? 0)
  const topCategory = [...categoryRows].sort((a, b) => Number(b.count) - Number(a.count))[0]
  const mostTweaked = mostTweakedRows[0] ?? null

  return NextResponse.json({
    total,
    topRated,
    mostActiveCategory: topCategory?.category ?? null,
    mostTweakedRecipe: mostTweaked ? { title: mostTweaked.title, tweakCount: Number(mostTweaked.tweakCount) } : null,
    tierCounts: tierRows.map(r => ({ tier: r.tier, count: Number(r.count) })),
    categoryCounts: categoryRows.map(r => ({ category: r.category, count: Number(r.count) })),
    recentlyAdded: recentRows,
  })
}
```

- [ ] **Step 2: Create components/insights-charts.tsx**

```typescript
'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const TIER_COLORS: Record<string, string> = {
  S: '#D4A017', A: '#C17F3E', B: '#8FAF6E',
  C: '#A0B4C8', D: '#C8A8B8', E: '#B0A89E',
}

const CATEGORY_LABELS: Record<string, string> = {
  snacks: 'Snacks', breakfast: 'Breakfast',
  lunch_dinner: 'Lunch & Dinner', desserts: 'Desserts', drinks: 'Drinks',
}

interface TierData { tier: string | null; count: number }
interface CategoryData { category: string | null; count: number }

export function TierBarChart({ data }: { data: TierData[] }) {
  const sorted = ['S', 'A', 'B', 'C', 'D', 'E'].map(tier => ({
    tier,
    count: data.find(d => d.tier === tier)?.count ?? 0,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDE0CE" vertical={false} />
        <XAxis dataKey="tier" tick={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, borderRadius: 8, border: '1px solid #EDE0CE' }}
          cursor={{ fill: '#EDE0CE44' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Recipes">
          {sorted.map(entry => (
            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#B0A89E'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryBarChart({ data }: { data: CategoryData[] }) {
  const chartData = data.map(d => ({
    category: d.category ? (CATEGORY_LABELS[d.category] ?? d.category) : 'Unknown',
    count: d.count,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDE0CE" vertical={false} />
        <XAxis dataKey="category" tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, borderRadius: 8, border: '1px solid #EDE0CE' }}
          cursor={{ fill: '#EDE0CE44' }}
        />
        <Bar dataKey="count" fill="#C17F3E" radius={[6, 6, 0, 0]} name="Recipes" />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 3: Create app/insights/page.tsx**

```typescript
'use client'
import { useEffect, useState, useCallback } from 'react'
import { TierBarChart, CategoryBarChart } from '@/components/insights-charts'

interface Stats {
  total: number
  topRated: number
  mostActiveCategory: string | null
  mostTweakedRecipe: { title: string; tweakCount: number } | null
  tierCounts: Array<{ tier: string | null; count: number }>
  categoryCounts: Array<{ category: string | null; count: number }>
  recentlyAdded: Array<{ id: string; title: string; tier: string | null; photoUrl: string | null; createdAt: string }>
}

const CATEGORY_LABELS: Record<string, string> = {
  snacks: 'Snacks', breakfast: 'Breakfast',
  lunch_dinner: 'Lunch & Dinner', desserts: 'Desserts', drinks: 'Drinks',
}
const TIER_COLORS: Record<string, string> = {
  S: '#D4A017', A: '#C17F3E', B: '#8FAF6E',
  C: '#A0B4C8', D: '#C8A8B8', E: '#B0A89E',
}

export default function InsightsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/insights')
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const statCards = stats ? [
    { label: 'Total Recipes', value: stats.total, emoji: '📚' },
    { label: 'S-Tier Recipes', value: stats.topRated, emoji: '🏆' },
    { label: 'Top Category', value: stats.mostActiveCategory ? (CATEGORY_LABELS[stats.mostActiveCategory] ?? stats.mostActiveCategory) : '—', emoji: '🍽️' },
    { label: 'Most Tweaked', value: stats.mostTweakedRecipe ? `${stats.mostTweakedRecipe.title} (${stats.mostTweakedRecipe.tweakCount})` : '—', emoji: '✏️' },
  ] : []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2.5rem', margin: 0 }}>
          Insights
        </h1>
        <button
          onClick={load}
          disabled={loading}
          style={{
            padding: '8px 16px', background: 'var(--color-primary)', color: '#fff',
            border: 'none', borderRadius: 10, fontFamily: 'var(--font-dm-sans)',
            fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stat cards */}
      {loading && !stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              height: 96, borderRadius: 16,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              animation: 'pulse 1.5s infinite',
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 40 }}>
          {statCards.map(card => (
            <div key={card.label} style={{
              padding: '20px 20px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
              borderRadius: 16, boxShadow: '0 2px 8px rgba(44,26,14,0.06)',
            }}>
              <div style={{ fontSize: '1.75rem', marginBottom: 8 }}>{card.emoji}</div>
              <div style={{
                fontFamily: 'var(--font-playfair)', fontWeight: 700,
                fontSize: '1.5rem', color: 'var(--color-text-primary)',
                marginBottom: 4,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {card.value}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-sans)', fontSize: '0.8rem',
                color: 'var(--color-text-muted)', fontWeight: 500,
              }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
          <div style={{
            padding: '24px', background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: 16,
          }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 16, marginTop: 0 }}>
              By Tier
            </h2>
            <TierBarChart data={stats.tierCounts} />
          </div>
          <div style={{
            padding: '24px', background: 'var(--color-surface)',
            border: '1px solid var(--color-border)', borderRadius: 16,
          }}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.25rem', marginBottom: 16, marginTop: 0 }}>
              By Category
            </h2>
            <CategoryBarChart data={stats.categoryCounts} />
          </div>
        </div>
      )}

      {/* Recently added */}
      {stats && stats.recentlyAdded.length > 0 && (
        <div>
          <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.5rem', marginBottom: 16 }}>
            Recently Added
          </h2>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
            {stats.recentlyAdded.map(r => (
              <a key={r.id} href={`/recipes/${r.id}`} style={{
                display: 'block', flexShrink: 0, width: 160, textDecoration: 'none',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{ width: '100%', aspectRatio: '4/3', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                  {r.photoUrl ? (
                    <img src={r.photoUrl} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '🍽️'}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  {r.tier && (
                    <span style={{
                      fontFamily: 'var(--font-dm-mono)', fontWeight: 600,
                      fontSize: '0.75rem', color: TIER_COLORS[r.tier] ?? '#B0A89E',
                      letterSpacing: '0.08em',
                    }}>{r.tier} </span>
                  )}
                  <p style={{
                    fontFamily: 'var(--font-playfair)', fontWeight: 600,
                    fontSize: '0.85rem', margin: 0, color: 'var(--color-text-primary)',
                    lineHeight: 1.3,
                  }}>
                    {r.title}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify insights page**

Navigate to `http://localhost:3000/insights`. Expect stat cards with correct data, two Recharts bar charts, and recently added scroll row. The Refresh button should reload stats.

- [ ] **Step 5: Commit**

```bash
git add app/api/insights/route.ts components/insights-charts.tsx app/insights/page.tsx
git commit -m "feat: insights dashboard with stat cards and Recharts charts"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `/` — tier board with S→E rows, compact thumbnails, empty state
- [x] `/recipes` — grid view
- [x] `/recipes/[id]` — photo, ingredients, steps, review, tweak log (add/delete)
- [x] `/add` — URL parser, caption field for social, category pills, tier buttons, review, photo upload
- [x] `/insights` — stat cards, tier bar chart, category bar chart, recently added scroll row
- [x] `POST /api/parse-recipe` — GPT-4o only, source detection, HTML extraction
- [x] `POST /api/recipes/[id]/tweaks` — insert tweak
- [x] `DELETE /api/tweaks/[tweakId]` — delete tweak
- [x] `GET /api/insights` — SQL only, no LLM
- [x] Playfair Display headings, DM Sans body, DM Mono tier badges
- [x] Design tokens from DESIGN.md (colors, shadows, border-radius)
- [x] `use cache` on tier board and recipe grid data functions
- [x] GPT-4o NOT called anywhere except parse-recipe

**Missing from spec now addressed:**
- `POST /api/recipes` (save new recipe) — added in Task 4
- `PATCH + DELETE /api/recipes/[id]` (edit/delete recipe) — added in Task 5
- Cloudinary `recipe_vault` upload preset — must be created in Cloudinary dashboard (unsigned preset named `recipe_vault`)

**Cloudinary setup note:** Before using the photo upload, create an unsigned upload preset named `recipe_vault` in the Cloudinary dashboard at cloudinary.com → Settings → Upload → Upload presets.
