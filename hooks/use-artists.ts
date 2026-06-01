'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Artist {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  genre: string
  rating: number
  verified: boolean
  created_at: string
}

interface Interaction {
  id: string
  user_id: string
  artist_id: string
  interaction_type: 'follow' | 'like'
  created_at: string
}

export function useArtists(userId?: string) {
  const [artists, setArtists] = useState<Artist[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Fetch all artists
      const { data: artistsData, error: artistsError } = await supabase
        .from('artists')
        .select('*')
        .order('rating', { ascending: false })

      if (artistsError) {
        setError(artistsError)
        return
      }

      setArtists(artistsData || [])

      // Fetch user interactions if userId provided
      if (userId) {
        const { data: interactionsData, error: interactionsError } = await supabase
          .from('interactions')
          .select('*')
          .eq('user_id', userId)

        if (interactionsError) {
          console.error('Error fetching interactions:', interactionsError)
        } else {
          setInteractions(interactionsData || [])
        }
      }

      setLoading(false)
    }

    fetchData()
  }, [userId])

  const toggleInteraction = async (artistId: string, userId: string, type: 'follow' | 'like') => {
    const supabase = createClient()

    // Check if interaction already exists
    const existing = interactions.find(
      (i) => i.artist_id === artistId && i.interaction_type === type && i.user_id === userId
    )

    if (existing) {
      // Delete interaction
      const { error } = await supabase.from('interactions').delete().eq('id', existing.id)

      if (error) {
        setError(error)
        throw error
      }

      setInteractions((prev) => prev.filter((i) => i.id !== existing.id))
    } else {
      // Create interaction
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          user_id: userId,
          artist_id: artistId,
          interaction_type: type,
        })
        .select()
        .single()

      if (error) {
        setError(error)
        throw error
      }

      if (data) {
        setInteractions((prev) => [...prev, data])
      }
    }
  }

  const isFollowing = (artistId: string) => {
    return interactions.some((i) => i.artist_id === artistId && i.interaction_type === 'follow')
  }

  const isLiked = (artistId: string) => {
    return interactions.some((i) => i.artist_id === artistId && i.interaction_type === 'like')
  }

  return {
    artists,
    interactions,
    loading,
    error,
    toggleInteraction,
    isFollowing,
    isLiked,
  }
}
