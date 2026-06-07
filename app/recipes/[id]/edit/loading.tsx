export default function Loading() {
  return (
    <div style={{
      maxWidth: 640,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ height: 40, width: 200, borderRadius: 8, background: 'var(--color-border)' }} />
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ height: 44, borderRadius: 10, background: 'var(--color-border)' }} />
      ))}
    </div>
  )
}
