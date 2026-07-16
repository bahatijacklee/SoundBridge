'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  username: string
  email?: string | null
  phone_number?: string | null
  is_blocked?: boolean
  blocked_reason?: string | null
  total_earnings: number
  total_points: number
  is_vip: boolean
  is_admin?: boolean
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionError, setActionError] = useState<string | null>(null)
  const [processingUserId, setProcessingUserId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_list_users')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setActionError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [supabase])

  const handleBlockToggle = async (user: User) => {
    const actionLabel = user.is_blocked ? 'unblock' : 'block'
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} ${user.username}?`)
    if (!confirmed) return

    try {
      setActionError(null)
      setProcessingUserId(user.id)

      if (user.is_blocked) {
        const { error } = await supabase.rpc('admin_unblock_user', {
          p_user_id: user.id,
        })

        if (error) throw error
      } else {
        const reason = window.prompt('Optional block reason:', user.blocked_reason || '')
        const { error } = await supabase.rpc('admin_block_user', {
          p_user_id: user.id,
          p_reason: reason || null,
        })

        if (error) throw error
      }

      await fetchUsers()
    } catch (error: any) {
      console.error('Error updating user status:', error)
      setActionError(error?.message || `Failed to ${actionLabel} user`)
    } finally {
      setProcessingUserId(null)
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Users</h1>
        <p className="text-slate-500 mt-1">Manage all users on the platform</p>
      </div>

      {actionError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      ) : null}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Earnings</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">VIP</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-700">
                          {(user.username || user.email || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{user.username}</div>
                        {user.email ? (
                          <div className="text-sm text-slate-500 truncate">{user.email}</div>
                        ) : null}
                        <div className="text-sm text-slate-500 truncate">
                          {user.phone_number ? user.phone_number : '—'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    ${Number(user.total_earnings).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {user.total_points}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_blocked ? (
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Blocked
                        </span>
                        {user.blocked_reason ? (
                          <div className="text-xs text-slate-500 max-w-40 truncate" title={user.blocked_reason}>
                            {user.blocked_reason}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.is_vip ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        VIP
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => handleBlockToggle(user)}
                      disabled={processingUserId === user.id || !!user.is_admin}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        user.is_blocked
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {processingUserId === user.id ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </span>
                      ) : user.is_blocked ? (
                        'Unblock'
                      ) : (
                        'Block'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
