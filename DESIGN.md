# DESIGN.md — Recipe Tier Vault

## 1. Visual Theme & Atmosphere

**Name:** Vanilla & Caramel  
**Mood:** Cosy, editorial, warm — like a beautiful personal recipe journal meets a café menu. Cute without being childish. Elevated without being cold.  
**Density:** Comfortable. Generous whitespace. Content breathes.  
**Design philosophy:** Rounded cards, soft shadows, warm surfaces. Every screen should feel like opening a well-loved recipe notebook. Food photography is the hero — the UI frames it, never competes with it.  
**Personality:** Personal, warm, tactile, a little editorial. Think Sunday brunch, not corporate dashboard.

---

## 2. Color Palette & Roles

| Token                    | Hex       | Role                                            |
| ------------------------ | --------- | ----------------------------------------------- |
| `--color-bg`             | `#FDFAF5` | Page background — warm off-white                |
| `--color-surface`        | `#FFF8EE` | Cards, panels, modals                           |
| `--color-surface-raised` | `#FFFFFF` | Elevated cards, dropdowns                       |
| `--color-primary`        | `#C17F3E` | Caramel — primary buttons, active states, links |
| `--color-primary-hover`  | `#A86A2C` | Darker caramel on hover                         |
| `--color-primary-light`  | `#E8C99A` | Light caramel — tags, chips, hover backgrounds  |
| `--color-text-primary`   | `#2C1A0E` | Deep espresso — headings, body                  |
| `--color-text-muted`     | `#8C6A4F` | Subtext, placeholders, metadata                 |
| `--color-border`         | `#EDE0CE` | Subtle warm dividers                            |
| `--color-border-strong`  | `#D4C0A8` | Input borders, card outlines                    |
| `--color-success`        | `#6A9E5B` | Sage green — saved, confirmed states            |
| `--color-error`          | `#C0523A` | Warm red — errors                               |

### Tier Badge Colors

| Tier | Hex       | Feel                            |
| ---- | --------- | ------------------------------- |
| S    | `#D4A017` | Gold — legendary                |
| A    | `#C17F3E` | Caramel — excellent             |
| B    | `#8FAF6E` | Sage green — solid              |
| C    | `#A0B4C8` | Dusty blue — decent             |
| D    | `#C8A8B8` | Mauve — disappointing           |
| E    | `#B0A89E` | Warm grey — wouldn't make again |

---

## 3. Typography Rules

| Role                     | Font             | Weight | Size             |
| ------------------------ | ---------------- | ------ | ---------------- |
| Display / Hero heading   | Playfair Display | 700    | 2.5rem–3.5rem    |
| Section headings (H2)    | Playfair Display | 600    | 1.75rem–2rem     |
| Card titles (H3)         | Playfair Display | 600    | 1.125rem–1.25rem |
| Body text                | DM Sans          | 400    | 0.9375rem (15px) |
| UI labels, buttons       | DM Sans          | 500    | 0.875rem (14px)  |
| Captions, metadata       | DM Sans          | 400    | 0.75rem (12px)   |
| Tier badges, mono labels | DM Mono          | 600    | 0.875rem         |
| Tags, chips              | DM Sans          | 500    | 0.75rem          |

**Import:** Google Fonts — Playfair Display (600, 700), DM Sans (400, 500), DM Mono (600)  
**Line height:** Body 1.6, headings 1.2  
**Letter spacing:** Tier badges +0.08em uppercase, tags +0.04em

---

## 4. Component Stylings

### Buttons

- **Primary:** Background `--color-primary`, text white, border-radius 10px, padding 10px 20px, font DM Sans 500 14px. Hover: `--color-primary-hover`, slight translateY(-1px), box-shadow `0 4px 12px rgba(193,127,62,0.3)`
- **Secondary:** Border 1.5px `--color-border-strong`, background transparent, text `--color-text-primary`. Hover: background `--color-primary-light`
- **Ghost:** No border, text `--color-primary`. Hover: background `--color-primary-light`
- **Danger:** Background `#FFF0ED`, text `--color-error`, border 1px `#F0C4BA`

### Cards

- Background: `--color-surface`
- Border: 1px solid `--color-border`
- Border-radius: 16px
- Box-shadow: `0 2px 8px rgba(44,26,14,0.06)`
- Hover: box-shadow `0 6px 20px rgba(44,26,14,0.10)`, translateY(-2px), transition 200ms ease
- Image area: 16:9 ratio, border-radius 12px 12px 0 0, object-fit cover

### Recipe Photo Cards

- Aspect ratio 4:3 for food photos
- Tier badge: absolute top-right, pill shape, DM Mono bold, colored per tier
- Category tag: absolute top-left, `--color-surface` background, small pill
- Source icon (TikTok/IG/Blog): bottom-left with favicon

### Tier List Board

- Board background: `--color-bg`
- Each tier row: horizontal scrollable strip
- Tier label: left column, 48px wide, DM Mono 600, uppercase, colored per tier, background tinted version of tier color at 15% opacity
- Recipe cards in tier: compact 120px wide thumbnails, draggable

### Inputs & Forms

- Border: 1.5px solid `--color-border-strong`
- Border-radius: 10px
- Background: `--color-surface-raised`
- Focus: border-color `--color-primary`, box-shadow `0 0 0 3px rgba(193,127,62,0.15)`
- Placeholder: `--color-text-muted`
- Font: DM Sans 400 15px

### Tags / Category Chips

- Background: `--color-primary-light`
- Text: `--color-primary-hover`
- Border-radius: 999px (pill)
- Padding: 4px 10px
- Font: DM Sans 500 12px uppercase letter-spacing 0.04em

### Navigation / Sidebar

- Background: `--color-surface`
- Border-right: 1px solid `--color-border`
- Active item: background `--color-primary-light`, text `--color-primary`, left border 3px `--color-primary`
- Nav font: DM Sans 500 14px

---

## 5. Layout Principles

**Spacing scale:** 4px base unit — 4, 8, 12, 16, 20, 24, 32, 48, 64px  
**Grid:** 12-column, max-width 1200px, 24px gutters  
**Page padding:** 24px mobile, 48px desktop  
**Card gap:** 20px in grids  
**Section spacing:** 48px between major sections

**Page structure:**

- Left sidebar (240px) — navigation, categories, filters
- Main content area — recipe grid or tier board
- No right sidebar — keep it uncluttered

---

## 6. Depth & Elevation

| Level | Usage             | Shadow                            |
| ----- | ----------------- | --------------------------------- |
| 0     | Page background   | none                              |
| 1     | Cards at rest     | `0 2px 8px rgba(44,26,14,0.06)`   |
| 2     | Cards on hover    | `0 6px 20px rgba(44,26,14,0.10)`  |
| 3     | Modals, dropdowns | `0 16px 40px rgba(44,26,14,0.14)` |
| 4     | Toasts, overlays  | `0 24px 60px rgba(44,26,14,0.18)` |

---

## 7. Do's and Don'ts

**Do:**

- Use Playfair Display for all headings — it's the editorial anchor
- Let food photography fill cards fully — images are the star
- Use tier badge colors consistently and only for tier labels
- Keep backgrounds warm — never pure white (#FFFFFF only for raised surfaces)
- Round everything — 10px buttons, 16px cards, pill tags
- Use generous padding inside cards

**Don't:**

- Don't use dark backgrounds anywhere — this is a light, warm app
- Don't use blue as a primary colour — it breaks the warm palette
- Don't use sans-serif for headings — Playfair Display only
- Don't make cards too small — recipe thumbnails need to feel generous
- Don't use more than 2 fonts on any single screen (Playfair + DM Sans)
- Don't use sharp corners (0px radius) anywhere

---

## 8. Responsive Behavior

| Breakpoint        | Layout                                                               |
| ----------------- | -------------------------------------------------------------------- |
| Mobile < 768px    | Single column, sidebar collapses to bottom tab bar, cards full width |
| Tablet 768–1024px | 2-column grid, sidebar hidden behind hamburger                       |
| Desktop > 1024px  | Sidebar visible, 3-column recipe grid                                |

**Touch targets:** Minimum 44px height for all interactive elements  
**Tier board on mobile:** Vertical stacked tiers instead of horizontal scroll

---

## 9. Agent Prompt Guide

**Quick color reference:**

- Primary action → `#C17F3E`
- Page bg → `#FDFAF5`
- Card bg → `#FFF8EE`
- Text → `#2C1A0E`
- Muted → `#8C6A4F`
- Border → `#EDE0CE`

**Ready-to-use prompts:**

- "Build a recipe card component following DESIGN.md with a photo, tier badge, category tag, title, and source icon"
- "Build the tier list board view following DESIGN.md with horizontal scrollable rows per tier (S/A/B/C/D/E)"
- "Build the add recipe form following DESIGN.md with URL input, title, category dropdown, tier selector, notes textarea, and photo upload"
- "Build the sidebar navigation following DESIGN.md with category filters and recipe count badges"
