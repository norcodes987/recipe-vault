import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes, tweaks } from '@/lib/schema'
import { desc, count, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  const [tierRows, categoryRows, mostTweakedRows, recentRows] = await Promise.all([
    db.select({ tier: recipes.tier, count: count() }).from(recipes).groupBy(recipes.tier),
    db.select({ category: recipes.category, count: count() }).from(recipes).groupBy(recipes.category),
    db.select({
        id: recipes.id,
        title: recipes.title,
        tier: recipes.tier,
        tweakCount: count(tweaks.id),
      })
      .from(recipes)
      .leftJoin(tweaks, eq(tweaks.recipeId, recipes.id))
      .groupBy(recipes.id, recipes.title, recipes.tier)
      .orderBy(desc(count(tweaks.id)))
      .limit(5),
    db.select({
        id: recipes.id,
        title: recipes.title,
        tier: recipes.tier,
        category: recipes.category,
        photoUrl: recipes.photoUrl,
        createdAt: recipes.createdAt,
      })
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(5),
  ])

  const total = tierRows.reduce((s, r) => s + Number(r.count), 0)
  const topRated = Number(tierRows.find(r => r.tier === 'S')?.count ?? 0)
  const topCategory = [...categoryRows].sort((a, b) => Number(b.count) - Number(a.count))[0]
  const mostTweaked = mostTweakedRows[0] ?? null

  return NextResponse.json({
    total,
    topRated,
    mostActiveCategory: topCategory?.category ?? null,
    mostTweakedRecipe: mostTweaked ? { title: mostTweaked.title, tweakCount: Number(mostTweaked.tweakCount) } : null,
    tierCounts: tierRows.map(r => ({ tier: r.tier, count: Number(r.count) })),
    categoryCounts: categoryRows.map(r => ({ category: r.category, count: Number(r.count) })),
    recentlyAdded: recentRows,
  })
}
