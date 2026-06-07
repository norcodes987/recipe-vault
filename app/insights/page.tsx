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

      {loading && !stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              height: 96, borderRadius: 16,
              background: 'var(--color-surface)', border: '1px solid var(--color-border)',
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
