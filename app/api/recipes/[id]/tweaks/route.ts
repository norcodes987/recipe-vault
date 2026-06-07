import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tweaks } from '@/lib/schema'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: recipeId } = await params
  const { note } = await request.json() as { note: string }
  if (!note?.trim()) return NextResponse.json({ error: 'note required' }, { status: 400 })
  const [tweak] = await db.insert(tweaks).values({ recipeId, note: note.trim() }).returning()
  return NextResponse.json(tweak, { status: 201 })
}
