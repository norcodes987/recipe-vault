'use client'
import { useState } from 'react'
import type { Tweak } from '@/lib/schema'

interface Props {
  recipeId: string
  initial: Tweak[]
}

export function TweakLog({ recipeId, initial }: Props) {
  const [tweakList, setTweakList] = useState<Tweak[]>(initial)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function addTweak() {
    if (!note.trim()) return
    setSaving(true)
    const res = await fetch(`/api/recipes/${recipeId}/tweaks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note }),
    })
    if (res.ok) {
      const tweak = await res.json()
      setTweakList(prev => [tweak, ...prev])
      setNote('')
    }
    setSaving(false)
  }

  async function deleteTweak(id: string) {
    await fetch(`/api/tweaks/${id}`, { method: 'DELETE' })
    setTweakList(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, fontSize: '1.5rem', marginBottom: 16 }}>
        Tweak Log
      </h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTweak()}
          placeholder="+ Add tweak — e.g. use oat flour instead"
          style={{
            flex: 1, padding: '10px 14px',
            border: '1.5px solid var(--color-border-strong)',
            borderRadius: 10, background: 'var(--color-surface-raised)',
            fontFamily: 'var(--font-dm-sans)', fontSize: '0.9375rem',
            color: 'var(--color-text-primary)', outline: 'none',
          }}
        />
        <button
          onClick={addTweak} disabled={saving || !note.trim()}
          style={{
            padding: '10px 16px', background: 'var(--color-primary)',
            color: '#fff', border: 'none', borderRadius: 10,
            fontFamily: 'var(--font-dm-sans)', fontWeight: 500,
            fontSize: '0.875rem', cursor: 'pointer',
          }}
        >
          Add
        </button>
      </div>
      {tweakList.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontFamily: 'var(--font-dm-sans)', fontSize: '0.875rem' }}>
          No tweaks yet — cook it and see what you&apos;d change.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tweakList.map(t => (
            <li key={t.id} style={{
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              padding: '10px 14px',
              background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10,
            }}>
              <div>
                <p style={{ margin: 0, fontFamily: 'var(--font-dm-sans)', fontSize: '0.9375rem', color: 'var(--color-text-primary)' }}>
                  {t.note}
                </p>
                <p style={{ margin: '4px 0 0', fontFamily: 'var(--font-dm-sans)', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {new Date(t.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => deleteTweak(t.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-text-muted)', fontSize: '1rem',
                  padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                }}
                aria-label="Delete tweak"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
