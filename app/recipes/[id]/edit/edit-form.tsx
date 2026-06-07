'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { TierBadge, type Tier } from '@/components/tier-badge'
import type { Recipe } from '@/lib/schema'

const PhotoUpload = dynamic(() => import('@/components/photo-upload').then(m => m.PhotoUpload), { ssr: false })

const CATEGORIES = [
  { value: 'snacks',       label: 'Snacks' },
  { value: 'breakfast',    label: 'Breakfast' },
  { value: 'lunch_dinner', label: 'Lunch & Dinner' },
  { value: 'desserts',     label: 'Desserts' },
  { value: 'drinks',       label: 'Drinks' },
] as const

type Category = typeof CATEGORIES[number]['value']
const TIERS: Tier[] = ['S', 'A', 'B', 'C', 'D', 'E']

export function EditForm({ recipe }: { recipe: Recipe }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const [title, setTitle] = useState(recipe.title)
  const [category, setCategory] = useState<Category | null>((recipe.category as Category) ?? null)
  const [tier, setTier] = useState<Tier | null>((recipe.tier as Tier) ?? null)
  const [review, setReview] = useState(recipe.review ?? '')
  const [photoUrl, setPhotoUrl] = useState(recipe.photoUrl ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !category || !tier) { setError('Title, category, and tier are required.'); return }
    startTransition(async () => {
      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, tier, review: review || null, photoUrl: photoUrl || null }),
      })
      if (res.ok) router.push(`/recipes/${recipe.id}`)
      else setError('Failed to save changes.')
    })
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <button onClick={() => router.back()} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 24,
        fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', color: 'var(--color-text-muted)',
      }}>
        ← Back
      </button>

      <h1 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, fontSize: '2rem', marginBottom: 32 }}>
        Edit Recipe
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <label style={S.label}>Title *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Recipe name" required style={S.input} />
        </div>

        <div>
          <label style={S.label}>Category *</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => (
              <button key={c.value} type="button" onClick={() => setCategory(c.value)} style={{
                ...S.chip, cursor: 'pointer',
                border: category === c.value ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '6px 14px', fontSize: '0.875rem',
                background: category === c.value ? 'var(--color-primary-light)' : 'var(--color-surface)',
              }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

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

        <div>
          <label style={S.label}>Your Review</label>
          <textarea value={review} onChange={e => setReview(e.target.value)}
            placeholder="Overall impression after cooking…" rows={3}
            style={{ ...S.input, resize: 'vertical' }} />
        </div>

        <div>
          <label style={S.label}>Photo</label>
          <PhotoUpload photoUrl={photoUrl} onUpload={setPhotoUrl} btnStyle={S.btnSecondary} />
        </div>

        {error && <p style={{ color: 'var(--color-error)', fontSize: '0.875rem', margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={isPending} style={{ ...S.btnPrimary, flex: 1, justifyContent: 'center' }}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} style={S.btnSecondary}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const S = {
  label: {
    display: 'block', fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
    fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid var(--color-border-strong)', borderRadius: 10,
    background: 'var(--color-surface-raised)', fontFamily: 'var(--font-dm-sans)',
    fontSize: '0.9375rem', color: 'var(--color-text-primary)', outline: 'none',
  } as React.CSSProperties,
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
    background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
  } as React.CSSProperties,
  btnSecondary: {
    display: 'inline-flex', alignItems: 'center', padding: '10px 20px',
    background: 'transparent', color: 'var(--color-text-primary)',
    border: '1.5px solid var(--color-border-strong)', borderRadius: 10,
    fontFamily: 'var(--font-dm-sans)', fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
  } as React.CSSProperties,
  chip: {
    padding: '4px 10px', background: 'var(--color-primary-light)',
    color: 'var(--color-primary-hover)', borderRadius: 999,
    fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
    fontSize: '0.75rem', letterSpacing: '0.04em', textTransform: 'uppercase',
  } as React.CSSProperties,
}
