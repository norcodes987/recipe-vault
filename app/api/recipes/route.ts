import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import type { NewRecipe } from '@/lib/schema'

export async function POST(request: NextRequest) {
  const body = await request.json() as NewRecipe
  const [recipe] = await db.insert(recipes).values(body).returning()
  return NextResponse.json(recipe, { status: 201 })
}
