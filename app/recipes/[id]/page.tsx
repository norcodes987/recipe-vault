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
      <Link href="/recipes" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
        ← All Recipes
      </Link>

      {recipe.photoUrl && (
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
          <Image src={recipe.photoUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} sizes="800px" priority loading="eager" />
        </div>
      )}

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

      <div style={{ paddingTop: 32, borderTop: '1px solid var(--color-border)', marginTop: 32 }}>
        <TweakLog recipeId={recipe.id} initial={recipeTweaks} />
      </div>
    </div>
  )
}
