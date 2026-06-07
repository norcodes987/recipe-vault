import { cacheTag } from 'next/cache'
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { RecipeCard } from '@/components/recipe-card'
import type { Recipe } from '@/lib/schema'

async function getAllRecipes() {
  'use cache'
  cacheTag('recipes')
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
