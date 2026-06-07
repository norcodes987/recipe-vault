import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
  if (!recipe) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(recipe)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const [updated] = await db.update(recipes).set(body).where(eq(recipes.id, id)).returning()
  if (!updated) return NextResponse.json({ error: 'not found' }, { status: 404 })
  revalidateTag('recipes', 'max')
  return NextResponse.json(updated)
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.delete(recipes).where(eq(recipes.id, id))
  revalidateTag('recipes', 'max')
  return new NextResponse(null, { status: 204 })
}
