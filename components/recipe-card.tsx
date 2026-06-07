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
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: 'var(--color-primary-light)' }}>
          {recipe.photoUrl ? (
            <Image src={recipe.photoUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
              🍽️
            </div>
          )}
          {recipe.tier && (
            <div style={{ position: 'absolute', top: 10, right: 10 }}>
              <TierBadge tier={recipe.tier} />
            </div>
          )}
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
