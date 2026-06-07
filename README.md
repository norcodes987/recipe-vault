# Recipe Vault

A personal recipe tier-board app. Save recipes from TikTok, Instagram, and food blogs, rank them S→E, log tweaks, and track stats.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Neon (Postgres) via Drizzle ORM |
| Styling | Tailwind CSS v4 + inline styles |
| AI | OpenAI GPT-4o — parse-recipe route only |
| Photos | Cloudinary via next-cloudinary |
| Charts | Recharts |
| Fonts | Playfair Display, DM Sans, DM Mono (Google Fonts) |

---

## Environment Variables

```
DATABASE_URL=              # Neon connection string (pooler URL)
OPENAI_API_KEY=            # GPT-4o for recipe parsing only
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Cloudinary also requires an **unsigned upload preset** named `recipe_vault` created in the Cloudinary dashboard (Settings → Upload → Upload presets).

---

## Feature Flows

### 1. Tier Board (`/`)

**What it does:** Displays all recipes grouped into 6 horizontal rows — S, A, B, C, D, E — each showing compact photo cards.

**Data flow:**
- Server component. Calls `db.select({ id, title, photoUrl, tier }).from(recipes)` once.
- Results are partitioned client-side into `{ S: [], A: [], B: [], ... }`.
- Wrapped in `'use cache'` so repeated visits skip the DB query until a recipe is added or modified.
- Each card links to `/recipes/[id]`.

---

### 2. Add Recipe (`/add`)

This is the most complex flow — it has two sub-flows: **parsing** and **saving**.

#### 2a. Parsing a recipe URL

1. User pastes a URL and clicks **Parse**.
2. Client calls `POST /api/parse-recipe` with `{ url, caption? }`.
3. The route:
   - Runs `detectSourceType(url)` to classify it as `tiktok | instagram | blog`.
   - Fetches the raw HTML from the URL (8s timeout, custom User-Agent).
   - For **blog** URLs: strips `<script>`, `<style>`, and all HTML tags, then truncates to 8,000 chars of plain text.
   - For **social** URLs: uses the caption the user pasted (the HTML is not useful for TikTok/Instagram).
   - Sends the cleaned text to **GPT-4o** with a system prompt instructing it to return `{ title, ingredients[], steps[] }` as JSON only.
   - Returns `{ title, ingredients, steps, source_type }` to the client.
4. The client pre-fills the title, ingredients, and steps fields.
5. The user reviews, picks a category and tier, optionally uploads a photo, writes a review, and submits.

#### 2b. Saving a recipe

1. User clicks **Save Recipe**.
2. Client calls `POST /api/recipes` with the full recipe object.
3. Route runs `db.insert(recipes).values(body).returning()` and returns the new row.
4. Client redirects to `/recipes/[id]` for the newly created recipe.

**Caption field:** Only shown when the URL contains `tiktok.com` or `instagram.com`, since social pages don't expose recipe content in HTML.

---

### 3. Recipe Grid (`/recipes`)

**What it does:** Shows all recipes as cards in a responsive grid, newest first.

**Data flow:**
- Server component. Calls `db.select({ id, title, photoUrl, tier, category, sourceType, createdAt }).from(recipes).orderBy(desc(createdAt))`.
- Wrapped in `'use cache'`.
- Each card shows a photo, tier badge, category chip, source icon (🎵 TikTok / 📸 Instagram / 📝 blog), and date.

---

### 4. Recipe Detail (`/recipes/[id]`)

**What it does:** Full view of a single recipe — hero photo, title, tier, review, ingredients, steps, and tweak log.

**Data flow:**
- Server component. Runs two queries in parallel via `Promise.all`:
  1. `db.select().from(recipes).where(eq(recipes.id, id)).limit(1)`
  2. `db.select().from(tweaks).where(eq(tweaks.recipeId, id)).orderBy(desc(createdAt))`
- Both resolve before the HTML is sent to the browser — no loading states.

#### Deleting a recipe

1. User clicks **Delete**.
2. A server action calls `DELETE /api/recipes/[id]`.
3. Route runs `db.delete(recipes).where(eq(recipes.id, id))` — cascades to delete all tweaks for that recipe.
4. Redirects to `/recipes`.

---

### 5. Edit Recipe (`/recipes/[id]/edit`)

**What it does:** Pre-filled form to update title, category, tier, review, and photo.

**Data flow:**
- Server component (`page.tsx`) fetches the recipe directly from the DB and passes it as a prop to the client `EditForm` component — no loading state or waterfall.
- On submit, client calls `PATCH /api/recipes/[id]` with `{ title, category, tier, review, photoUrl }`.
- Route runs `db.update(recipes).set(body).where(eq(recipes.id, id)).returning()`.
- On success, redirects to `/recipes/[id]`.

---

### 6. Tweak Log (`/recipes/[id]`)

The tweak log is a client component (`TweakLog`) embedded at the bottom of the detail page.

#### Adding a tweak

1. User types a note and presses Enter or clicks **Add**.
2. Client calls `POST /api/recipes/[id]/tweaks` with `{ note }`.
3. Route runs `db.insert(tweaks).values({ recipeId, note }).returning()`.
4. New tweak is prepended to the local list immediately (optimistic update).

#### Deleting a tweak

1. User clicks **×** on a tweak.
2. Client calls `DELETE /api/tweaks/[tweakId]`.
3. Route runs `db.delete(tweaks).where(eq(tweaks.id, tweakId))`.
4. Tweak is removed from the local list immediately.

---

### 7. Insights Dashboard (`/insights`)

**What it does:** Stats overview — total recipes, S-tier count, top category, most-tweaked recipe, two bar charts (by tier, by category), and a recently-added scroll row.

**Data flow:**
- Client component that fetches on mount and on each **Refresh** click.
- Calls `GET /api/insights`.
- The route runs four SQL queries in parallel via `Promise.all` — no LLM involved:

| Query | What it produces |
|---|---|
| `SELECT tier, count(*) FROM recipes GROUP BY tier` | Tier distribution for bar chart |
| `SELECT category, count(*) FROM recipes GROUP BY category` | Category distribution for bar chart |
| `SELECT recipes.*, count(tweaks.id) ... LEFT JOIN tweaks GROUP BY recipe ORDER BY count DESC LIMIT 5` | Most-tweaked recipes |
| `SELECT ... FROM recipes ORDER BY created_at DESC LIMIT 5` | Recently added |

- Returns a single JSON object with all stats to the client.
- Recharts renders the two bar charts from the `tierCounts` and `categoryCounts` arrays.

---

## API Routes

| Method | Route | What it does |
|---|---|---|
| `POST` | `/api/parse-recipe` | Fetches URL, strips HTML, calls GPT-4o, returns `{ title, ingredients, steps, source_type }` |
| `POST` | `/api/recipes` | Inserts a new recipe row, returns the created record |
| `GET` | `/api/recipes/[id]` | Returns a single recipe by ID |
| `PATCH` | `/api/recipes/[id]` | Updates fields on a recipe (title, category, tier, review, photoUrl) |
| `DELETE` | `/api/recipes/[id]` | Deletes a recipe and cascades to its tweaks |
| `POST` | `/api/recipes/[id]/tweaks` | Inserts a tweak for a recipe |
| `DELETE` | `/api/tweaks/[tweakId]` | Deletes a single tweak |
| `GET` | `/api/insights` | Returns aggregated stats (tier counts, category counts, most tweaked, recently added) |

---

## Database Schema

```
recipes
  id          uuid  PK
  title       text
  source_url  text
  source_type enum  tiktok | instagram | blog
  category    enum  snacks | breakfast | lunch_dinner | desserts | drinks
  tier        enum  S | A | B | C | D | E
  review      text
  photo_url   text
  ingredients jsonb  string[]
  steps       jsonb  string[]
  created_at  timestamp

tweaks
  id          uuid  PK
  recipe_id   uuid  FK → recipes.id (cascade delete)
  note        text
  created_at  timestamp
```

---

## Running Locally

```bash
npm install
npm run dev
```

Push schema changes to Neon:

```bash
npm run db:push
```

Run tests:

```bash
npm test
```
