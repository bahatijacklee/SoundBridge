'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Heart, UserPlus, Star, Verified } from 'lucide-react'

interface Artist {
  id: string
  name: string
  image_url: string
  rating: number
  genre: string
  verified: boolean
  bio: string
}

interface UserInteraction {
  artist_id: string
  interaction_type: string
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [interactions, setInteractions] = useState<UserInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterGenre, setFilterGenre] = useState('')
  const supabase = createClient()

  const genres = [
    'All',
    'Hip Hop',
    'Pop',
    'R&B',
    'EDM',
    'Rock',
    'Indie',
    'Latin',
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return

        // Fetch all artists
        let query = supabase.from('artists').select('*')

        if (filterGenre && filterGenre !== 'All') {
          query = query.eq('genre', filterGenre)
        }

        const { data: artistData } = await query.order('rating', {
          ascending: false,
        })

        if (artistData) {
          setArtists(artistData)
        }

        // Fetch user interactions
        const { data: userInteractions } = await supabase
          .from('interactions')
          .select('artist_id, interaction_type')
          .eq('user_id', authUser.id)

        if (userInteractions) {
          setInteractions(userInteractions)
        }
      } catch (error) {
        console.error('[v0] Error fetching artists:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, filterGenre])

  const handleFollow = async (artistId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      const isFollowing = interactions.some(
        (i) => i.artist_id === artistId && i.interaction_type === 'follow'
      )

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('interactions')
          .delete()
          .eq('user_id', authUser.id)
          .eq('artist_id', artistId)
          .eq('interaction_type', 'follow')
      } else {
        // Follow
        await supabase.from('interactions').insert({
          user_id: authUser.id,
          artist_id: artistId,
          interaction_type: 'follow',
        })
      }

      // Refresh interactions
      const { data: updatedInteractions } = await supabase
        .from('interactions')
        .select('artist_id, interaction_type')
        .eq('user_id', authUser.id)

      if (updatedInteractions) {
        setInteractions(updatedInteractions)
      }
    } catch (error) {
      console.error('[v0] Error following artist:', error)
    }
  }

  const handleLike = async (artistId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      const isLiked = interactions.some(
        (i) => i.artist_id === artistId && i.interaction_type === 'like'
      )

      if (isLiked) {
        // Unlike
        await supabase
          .from('interactions')
          .delete()
          .eq('user_id', authUser.id)
          .eq('artist_id', artistId)
          .eq('interaction_type', 'like')
      } else {
        // Like
        await supabase.from('interactions').insert({
          user_id: authUser.id,
          artist_id: artistId,
          interaction_type: 'like',
        })
      }

      // Refresh interactions
      const { data: updatedInteractions } = await supabase
        .from('interactions')
        .select('artist_id, interaction_type')
        .eq('user_id', authUser.id)

      if (updatedInteractions) {
        setInteractions(updatedInteractions)
      }
    } catch (error) {
      console.error('[v0] Error liking artist:', error)
    }
  }

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading artists...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Search and Filter */}
      <div className="space-y-3 md:space-y-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 md:px-4 py-2 md:py-3 bg-slate-800 border border-gray-700 rounded-lg text-white text-sm md:text-base placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none"
          />
        </div>

        {/* Genre Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() =>
                setFilterGenre(genre === 'All' ? '' : genre)
              }
              className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg whitespace-nowrap text-sm md:text-base transition-all ${
                (filterGenre === '' && genre === 'All') ||
                filterGenre === genre
                  ? 'bg-yellow-400 text-slate-900 font-bold'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Artists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredArtists.map((artist) => {
          const isFollowing = interactions.some(
            (i) =>
              i.artist_id === artist.id && i.interaction_type === 'follow'
          )
          const isLiked = interactions.some(
            (i) => i.artist_id === artist.id && i.interaction_type === 'like'
          )

          return (
            <div
              key={artist.id}
              className="bg-gradient-to-br from-slate-800 to-slate-700 border border-yellow-400 border-opacity-20 rounded-xl overflow-hidden hover:border-yellow-400 hover:border-opacity-60 transition-all group shadow-lg hover:shadow-xl hover:shadow-yellow-400/10"
            >
              {/* Image */}
              {artist.image_url && (
                <div className="relative h-56 overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800">
                  <img
                    src={artist.image_url}
                    alt={artist.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-40"></div>
                  <div className="absolute top-4 right-4 bg-gradient-to-br from-yellow-400 to-yellow-500 bg-opacity-20 px-3 py-1.5 rounded-full border border-yellow-400 border-opacity-60 backdrop-blur-sm">
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                      <span className="text-xs font-bold text-yellow-300">
                        {artist.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {artist.name}
                    </h3>
                    {artist.verified && (
                      <Verified className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-300">{artist.genre}</p>
                </div>

                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                  {artist.bio}
                </p>

                {/* Reward Badge */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-opacity-10 border border-yellow-400 border-opacity-40 rounded-lg p-4 text-center shadow-sm">
                  <p className="text-xs text-gray-300 mb-1.5 font-medium">Reward for Follow</p>
                  <p className="text-2xl font-bold text-yellow-400">$5.00</p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleFollow(artist.id)}
                    className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isFollowing
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'border border-blue-400 border-opacity-50 text-blue-300 hover:bg-blue-600 hover:text-white hover:border-opacity-100'
                    }`}
                  >
                    <UserPlus className="w-4 h-4" />
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>

                  <button
                    onClick={() => handleLike(artist.id)}
                    className={`w-full py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isLiked
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30'
                        : 'border border-red-400 border-opacity-50 text-red-300 hover:bg-red-600 hover:text-white hover:border-opacity-100'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filteredArtists.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No artists found</p>
        </div>
      )}
    </div>
  )
}
