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
