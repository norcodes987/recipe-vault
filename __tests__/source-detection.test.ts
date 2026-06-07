import { detectSourceType } from '@/lib/source-detection'

describe('detectSourceType', () => {
  it('returns tiktok for tiktok.com URLs', () => {
    expect(detectSourceType('https://www.tiktok.com/@chef/video/123')).toBe('tiktok')
  })

  it('returns instagram for instagram.com URLs', () => {
    expect(detectSourceType('https://www.instagram.com/reel/abc123')).toBe('instagram')
  })

  it('returns blog for any other domain', () => {
    expect(detectSourceType('https://halfbakedharvest.com/pasta')).toBe('blog')
  })

  it('returns blog for youtube.com', () => {
    expect(detectSourceType('https://youtube.com/watch?v=abc')).toBe('blog')
  })
})
