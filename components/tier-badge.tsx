export const TIER_CONFIG = {
  S: '#D4A017',
  A: '#C17F3E',
  B: '#8FAF6E',
  C: '#A0B4C8',
  D: '#C8A8B8',
  E: '#B0A89E',
} as const

export type Tier = keyof typeof TIER_CONFIG

interface Props {
  tier: Tier
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { fontSize: '0.75rem', padding: '2px 8px' },
  md: { fontSize: '0.875rem', padding: '4px 10px' },
  lg: { fontSize: '1rem', padding: '6px 14px' },
}

export function TierBadge({ tier, size = 'md' }: Props) {
  return (
    <span style={{
      fontFamily: 'var(--font-dm-mono)',
      fontWeight: 600,
      ...SIZES[size],
      borderRadius: 999,
      background: TIER_CONFIG[tier],
      color: '#fff',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      display: 'inline-block',
      lineHeight: 1.4,
    }}>
      {tier}
    </span>
  )
}
