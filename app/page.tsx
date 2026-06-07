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
