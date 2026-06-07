'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DollarSign, Loader2 } from 'lucide-react'

type AdminUserRow = {
  id: string
  username: string
  email: string | null
  phone_number: string | null
  total_earnings: number
}

export default function AdminDeposits() {
  const supabase = createClient()
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_list_users')
      if (error) throw error
      setUsers((data as AdminUserRow[]) || [])
    } catch (e) {
      console.error('Error fetching users:', e)
      setError('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedAmount = Number(amount)
    if (!selectedUserId) {
      setError('Select a user')
      return
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a valid amount greater than 0')
      return
    }

    try {
      setIsSubmitting(true)
      const { error } = await supabase.rpc('admin_create_deposit', {
        p_user_id: selectedUserId,
        p_amount: parsedAmount,
        p_description: description.trim() || null,
      })
      if (error) throw error

      setSuccess('Deposit added successfully')
      setAmount('')
      setDescription('')
      await fetchUsers()
    } catch (e: any) {
      console.error('Error creating deposit:', e)
      setError(e?.message ?? 'Failed to add deposit')
    } finally {
      setIsSubmitting(false)
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
        <h1 className="text-3xl font-bold text-slate-900">Deposits</h1>
        <p className="text-slate-500 mt-1">Credit a user’s balance</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <Label className="text-slate-700">User</Label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-2 w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            >
              <option value="" disabled>
                Select a user
              </option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.username}
                  {u.email ? ` — ${u.email}` : ''}
                </option>
              ))}
            </select>
            {selectedUser ? (
              <div className="mt-2 text-sm text-slate-500">
                Current balance: ${Number(selectedUser.total_earnings).toFixed(2)}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="text-slate-700">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="mt-2 bg-white text-slate-900"
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-slate-700">
                Description (optional)
              </Label>
              <Input
                id="description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Admin deposit"
                className="mt-2 bg-white text-slate-900"
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <DollarSign className="w-4 h-4 mr-2" />
            )}
            Add Deposit
          </Button>
        </form>
      </div>
    </div>
  )
}
