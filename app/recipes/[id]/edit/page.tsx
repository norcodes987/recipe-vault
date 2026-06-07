import { db } from '@/lib/db'
import { recipes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditForm } from './edit-form'

export default async function EditRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [recipe] = await db.select().from(recipes).where(eq(recipes.id, id)).limit(1)
  if (!recipe) notFound()
  return <EditForm recipe={recipe} />
}
