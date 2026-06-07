export type SourceType = 'tiktok' | 'instagram' | 'blog'

export function detectSourceType(url: string): SourceType {
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('instagram.com')) return 'instagram'
  return 'blog'
}
