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
