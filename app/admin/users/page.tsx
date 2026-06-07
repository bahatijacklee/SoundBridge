'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users as UsersIcon, Loader2 } from 'lucide-react'

interface User {
  id: string
  username: string
  email?: string | null
  phone_number?: string | null
  total_earnings: number
  total_points: number
  is_vip: boolean
  is_admin?: boolean
  created_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase.rpc('admin_list_users')

        if (error) throw error
        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [supabase])

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

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Earnings</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Points</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">VIP</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
