'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Music, Plus, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Artist {
  id: string
  name: string
  image_url: string | null
  bio: string | null
  genre: string | null
  rating: number
  verified: boolean
  created_at: string
}

type ArtistFormState = {
  name: string
  genre: string
  bio: string
  image_url: string
  verified: boolean
  rating: string
}

export default function AdminArtists() {
  const [artists, setArtists] = useState<Artist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [form, setForm] = useState<ArtistFormState>({
    name: '',
    genre: '',
    bio: '',
    image_url: '',
    verified: false,
    rating: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchArtists()
  }, [])

  const fetchArtists = async () => {
    try {
      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setArtists(data || [])
    } catch (error) {
      console.error('Error fetching artists:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const openAddModal = () => {
    setSelectedArtist(null)
    setForm({
      name: '',
      genre: '',
      bio: '',
      image_url: '',
      verified: false,
      rating: '',
    })
    setModalMode('add')
  }

  const openEditModal = (artist: Artist) => {
    setSelectedArtist(artist)
    setForm({
      name: artist.name ?? '',
      genre: artist.genre ?? '',
      bio: artist.bio ?? '',
      image_url: artist.image_url ?? '',
      verified: !!artist.verified,
      rating: Number.isFinite(artist.rating) ? String(artist.rating) : '',
    })
    setModalMode('edit')
  }

  const closeModal = () => {
    setModalMode(null)
    setSelectedArtist(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Partial<Artist> = {
        name: form.name.trim(),
        genre: form.genre.trim() ? form.genre.trim() : null,
        bio: form.bio.trim() ? form.bio.trim() : null,
        image_url: form.image_url.trim() ? form.image_url.trim() : null,
        verified: form.verified,
      }

      if (!payload.name) {
        throw new Error('Artist name is required')
      }

      if (form.rating.trim() !== '') {
        const ratingValue = Number(form.rating)
        if (!Number.isFinite(ratingValue)) {
          throw new Error('Invalid rating')
        }
        payload.rating = ratingValue
      }

      if (modalMode === 'add') {
        const { error } = await supabase.from('artists').insert([payload])
        if (error) throw error
      }

      if (modalMode === 'edit' && selectedArtist) {
        const { error } = await supabase
          .from('artists')
          .update(payload)
          .eq('id', selectedArtist.id)
        if (error) throw error
      }

      await fetchArtists()
      closeModal()
    } catch (error) {
      console.error('Error saving artist:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Artists</h1>
          <p className="text-slate-500 mt-1">Manage all artists on the platform</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
        >
          <Plus className="w-4 h-4" />
          Add Artist
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artists.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Music className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No artists yet</h3>
            <p className="text-slate-500 mb-6">Add your first artist to get started</p>
            <Button 
              onClick={openAddModal}
              className="gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="w-4 h-4" />
              Add First Artist
            </Button>
          </div>
        ) : (
          artists.map((artist) => (
            <div
              key={artist.id}
              role="button"
              tabIndex={0}
              onClick={() => openEditModal(artist)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') openEditModal(artist)
              }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  {artist.image_url ? (
                    <img
                      src={artist.image_url}
                      alt={artist.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-xl font-bold text-white">
                      {artist.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                {artist.verified && (
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-slate-900 mb-1">{artist.name}</h3>
              
              {artist.genre && (
                <p className="text-sm text-purple-600 font-medium mb-2">{artist.genre}</p>
              )}
              
              {artist.bio && (
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{artist.bio}</p>
              )}
              
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="text-sm font-medium text-slate-700">{artist.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(artist.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={closeModal}
          />
          
          <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {modalMode === 'add' ? 'Add New Artist' : 'Edit Artist'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Artist Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="Enter artist name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Genre</label>
                <input
                  type="text"
                  value={form.genre}
                  onChange={(e) => setForm({ ...form, genre: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. Hip-Hop, Pop, R&B"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  placeholder="Artist bio..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rating</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="0.0 - 10.0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verified"
                  checked={form.verified}
                  onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                  className="w-4 h-4 text-slate-900 rounded"
                />
                <label htmlFor="verified" className="text-sm font-medium text-slate-700">
                  Verify this artist
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={closeModal}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                  {modalMode === 'add' ? 'Add Artist' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
