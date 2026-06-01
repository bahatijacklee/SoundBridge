'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  total_earnings: number
  total_points: number
  is_vip: boolean
  vip_expires_at: string | null
  created_at: string
  updated_at: string
}

interface LevelProgress {
  id: string
  user_id: string
  current_level: 'bronze' | 'silver' | 'gold' | 'platinum'
  progress_percentage: number
  total_tasks_completed: number
  total_artists_engaged: number
  updated_at: string
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const supabase = createClient()

    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)

      if (user) {
        // Fetch user profile
        supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data, error }) => {
            if (error) console.error('Error fetching user profile:', error)
            if (data) setProfile(data)
          })

        // Fetch level progress
        supabase
          .from('level_progress')
          .select('*')
          .eq('user_id', user.id)
          .single()
          .then(({ data, error }) => {
            if (error) console.error('Error fetching level progress:', error)
            if (data) setLevelProgress(data)
          })
      }

      setLoading(false)
    })

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      setError(error)
      throw error
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null))
  }

  return {
    user,
    profile,
    levelProgress,
    loading,
    error,
    updateProfile,
  }
}
