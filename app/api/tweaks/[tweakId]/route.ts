import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tweaks } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function DELETE(_request: Request, { params }: { params: Promise<{ tweakId: string }> }) {
  const { tweakId } = await params
  await db.delete(tweaks).where(eq(tweaks.id, tweakId))
  return new NextResponse(null, { status: 204 })
}
