'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',         label: 'Tier Board',  emoji: '🏆' },
  { href: '/recipes',  label: 'All Recipes', emoji: '📋' },
  { href: '/add',      label: 'Add Recipe',  emoji: '➕' },
  { href: '/insights', label: 'Insights',    emoji: '📊' },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'sticky',
      top: 0,
      alignSelf: 'flex-start',
      height: '100vh',
    }}>
      <div style={{ padding: '0 20px 32px' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair)',
          fontWeight: 700,
          fontSize: '1.375rem',
          color: 'var(--color-primary)',
          margin: 0,
        }}>
          Recipe Vault
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          personal tier board
        </p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px', flex: 1 }}>
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                borderRadius: 8,
                fontFamily: 'var(--font-dm-sans)',
                fontWeight: 500,
                fontSize: '0.875rem',
                textDecoration: 'none',
                color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
                background: active ? 'var(--color-primary-light)' : 'transparent',
                borderLeft: active ? '3px solid var(--color-primary)' : '3px solid transparent',
                transition: 'all 150ms ease',
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
