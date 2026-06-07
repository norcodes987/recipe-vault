'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';

const NAV = [
  { href: '/', label: 'Tier Board', emoji: '🏆' },
  { href: '/recipes', label: 'All Recipes', emoji: '📋' },
  { href: '/add', label: 'Add Recipe', emoji: '➕' },
  { href: '/insights', label: 'Insights', emoji: '📊' },
];

function subscribeMq(cb: () => void) {
  const mq = window.matchMedia('(max-width: 768px)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMobile = useSyncExternalStore(
    subscribeMq,
    () => window.matchMedia('(max-width: 768px)').matches,
    () => false,
  );

  // Sidebar is visually open only when on mobile AND toggled open
  const isOpen = isMobile && open;

  return (
    <>
      {/* Hamburger toggle — mobile only */}
      {isMobile && (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          style={{
            position: 'fixed',
            top: 14,
            left: 14,
            zIndex: 60,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1.125rem',
            color: 'var(--color-text-primary)',
            boxShadow: '0 2px 8px rgba(44,26,14,0.10)',
          }}
        >
          {isOpen ? '✕' : '☰'}
        </button>
      )}

      {/* Backdrop */}
      {isMobile && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44,26,14,0.45)',
            zIndex: 40,
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? 'auto' : 'none',
            transition: 'opacity 250ms ease',
          }}
        />
      )}

      {/* Sidebar panel */}
      <aside
        style={{
          width: 240,
          flexShrink: 0,
          background: 'var(--color-surface)',
          borderRight: '1px solid var(--color-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 0',
          height: '100vh',
          // Desktop: sticky in flow; Mobile: fixed overlay
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          alignSelf: 'flex-start',
          zIndex: isMobile ? 50 : undefined,
          transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: 'transform 250ms ease',
          boxShadow: isOpen ? '4px 0 24px rgba(44,26,14,0.12)' : 'none',
          overflowY: 'auto',
        }}
      >
        <div style={{ padding: '0 20px 32px' }}>
          <h1
            style={{
              fontFamily: 'var(--font-playfair)',
              fontWeight: 700,
              fontSize: '1.375rem',
              color: 'var(--color-primary)',
              margin: 0,
            }}
          >
            Recipe Vault
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            recipe ranker
          </p>
        </div>
        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            padding: '0 12px',
            flex: 1,
          }}
        >
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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
                  color: active
                    ? 'var(--color-primary)'
                    : 'var(--color-text-primary)',
                  background: active
                    ? 'var(--color-primary-light)'
                    : 'transparent',
                  borderLeft: active
                    ? '3px solid var(--color-primary)'
                    : '3px solid transparent',
                  transition: 'all 150ms ease',
                }}
              >
                <span style={{ fontSize: '1rem' }}>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
