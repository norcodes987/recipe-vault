import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { detectSourceType } from '@/lib/source-detection'

const openai = new OpenAI()

export async function POST(request: NextRequest) {
  const { url, caption } = await request.json() as { url: string; caption?: string }

  if (!url) return NextResponse.json({ error: 'url required' }, { status: 400 })

  const sourceType = detectSourceType(url)
  let pageText = caption ?? ''

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecipeVault/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    if (sourceType === 'blog') {
      pageText = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 8000)
    } else if (!caption) {
      pageText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000)
    }
  } catch {
    // continue with caption if fetch fails
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a recipe parser. Extract the recipe and return ONLY valid JSON: { "title": string, "ingredients": string[], "steps": string[] }. No markdown.',
      },
      {
        role: 'user',
        content: `Source: ${sourceType}\nURL: ${url}\n\n${pageText}`,
      },
    ],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(completion.choices[0].message.content ?? '{}')
  return NextResponse.json({ ...parsed, source_type: sourceType })
}
