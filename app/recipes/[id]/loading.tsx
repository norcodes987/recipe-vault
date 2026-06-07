export default function Loading() {
  return (
    <div style={{
      maxWidth: 800,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 24, width: 120, borderRadius: 8, background: 'var(--color-border)' }} />
      <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 16, background: 'var(--color-border)' }} />
      <div style={{ height: 48, width: '60%', borderRadius: 8, background: 'var(--color-border)' }} />
      <div style={{ height: 20, width: '40%', borderRadius: 8, background: 'var(--color-border)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{ height: 16, borderRadius: 6, background: 'var(--color-border)', width: `${80 - i * 10}%` }} />
        ))}
      </div>
    </div>
  )
}
