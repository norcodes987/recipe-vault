'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'

const TIER_COLORS: Record<string, string> = {
  S: '#D4A017', A: '#C17F3E', B: '#8FAF6E',
  C: '#A0B4C8', D: '#C8A8B8', E: '#B0A89E',
}

const CATEGORY_LABELS: Record<string, string> = {
  snacks: 'Snacks', breakfast: 'Breakfast',
  lunch_dinner: 'Lunch & Dinner', desserts: 'Desserts', drinks: 'Drinks',
}

interface TierData { tier: string | null; count: number }
interface CategoryData { category: string | null; count: number }

export function TierBarChart({ data }: { data: TierData[] }) {
  const sorted = ['S', 'A', 'B', 'C', 'D', 'E'].map(tier => ({
    tier,
    count: data.find(d => d.tier === tier)?.count ?? 0,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={sorted} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDE0CE" vertical={false} />
        <XAxis dataKey="tier" tick={{ fontFamily: 'var(--font-dm-mono)', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, borderRadius: 8, border: '1px solid #EDE0CE' }}
          cursor={{ fill: '#EDE0CE44' }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} name="Recipes">
          {sorted.map(entry => (
            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#B0A89E'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CategoryBarChart({ data }: { data: CategoryData[] }) {
  const chartData = data.map(d => ({
    category: d.category ? (CATEGORY_LABELS[d.category] ?? d.category) : 'Unknown',
    count: d.count,
  }))
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EDE0CE" vertical={false} />
        <XAxis dataKey="category" tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontFamily: 'var(--font-dm-sans)', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontFamily: 'var(--font-dm-sans)', fontSize: 13, borderRadius: 8, border: '1px solid #EDE0CE' }}
          cursor={{ fill: '#EDE0CE44' }}
        />
        <Bar dataKey="count" fill="#C17F3E" radius={[6, 6, 0, 0]} name="Recipes" />
      </BarChart>
    </ResponsiveContainer>
  )
}
