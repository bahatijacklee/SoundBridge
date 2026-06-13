'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

type LevelName = 'bronze' | 'silver' | 'gold' | 'platinum'

type LevelPrice = {
  level: LevelName
  price: string
}

const LEVELS: LevelName[] = ['bronze', 'silver', 'gold', 'platinum']

export default function AdminSettings() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [levelPricing, setLevelPricing] = useState<Record<LevelName, string>>({
    bronze: '0',
    silver: '15',
    gold: '50',
    platinum: '150',
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('level_pricing')
          .select('level, price')
          .order('price', { ascending: true })

        if (error) throw error

        if (data) {
          const nextState = { bronze: '0', silver: '15', gold: '50', platinum: '150' }
          for (const row of data as { level: LevelName; price: number }[]) {
            nextState[row.level] = String(row.price)
          }
          setLevelPricing(nextState)
        }
      } catch (e) {
        console.error('Error fetching admin settings:', e)
        setError('Failed to load level pricing')
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [supabase])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const payload: LevelPrice[] = LEVELS.map((level) => {
        const parsed = Number(levelPricing[level])
        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`Invalid price for ${level}`)
        }

        return {
          level,
          price: String(parsed),
        }
      })

      const { error } = await supabase.from('level_pricing').upsert(
        payload.map((row) => ({
          level: row.level,
          price: Number(row.price),
        })),
        { onConflict: 'level' },
      )

      if (error) throw error
      setSuccess('Level pricing updated successfully')
    } catch (e: any) {
      console.error('Error saving level pricing:', e)
      setError(e?.message || 'Failed to save level pricing')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage task level pricing for the platform</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-1">Task Level Pricing</h2>
        <p className="text-sm text-slate-500 mb-6">
          Users pay these amounts from their account balance to unlock higher task levels.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEVELS.map((level) => (
            <div key={level}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                {level} Price
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={levelPricing[level]}
                onChange={(e) =>
                  setLevelPricing((current) => ({
                    ...current,
                    [level]: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
          ))}
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}
