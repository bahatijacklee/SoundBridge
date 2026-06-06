'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Wallet, CheckCircle2, XCircle, Loader2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WithdrawalRequest {
  id: string
  user_id: string
  amount: number
  wallet_type: string
  wallet_address: string
  status: string
  notes: string | null
  created_at: string
  user: {
    username: string
  }
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const supabase = createClient()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select('*, user:users (username)')
          .order('created_at', { ascending: false })

        if (error) throw error
        setWithdrawals(data || [])
      } catch (error) {
        console.error('Error fetching withdrawals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWithdrawals()
  }, [supabase])

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id)
      const { error } = await supabase.rpc('approve_withdrawal_request', { p_request_id: id })
      if (error) throw error

      // Refresh the list
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*, user:users (username)')
        .order('created_at', { ascending: false })

      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error approving withdrawal:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id)
      const { error } = await supabase.rpc('reject_withdrawal_request', { p_request_id: id })
      if (error) throw error

      // Refresh the list
      const { data } = await supabase
        .from('withdrawal_requests')
        .select('*, user:users (username)')
        .order('created_at', { ascending: false })

      setWithdrawals(data || [])
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
            PENDING
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            APPROVED
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            REJECTED
          </span>
        )
      default:
        return null
    }
  }

  const copyToClipboard = (requestId: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(requestId)
    setTimeout(() => setCopiedId(null), 1500)
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
        <h1 className="text-3xl font-bold text-slate-900">Withdrawals</h1>
        <p className="text-slate-500 mt-1">Review and process withdrawal requests</p>
      </div>

      <div className="space-y-4">
        {withdrawals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No withdrawal requests yet</h3>
            <p className="text-slate-500">When users request withdrawals, they'll appear here.</p>
          </div>
        ) : (
          withdrawals.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-700">
                      {request.user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {request.user.username}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {getStatusBadge(request.status)}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ${Number(request.amount).toFixed(2)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Wallet</p>
                  <p className="font-medium text-slate-900 mb-1">
                    {request.wallet_type.toUpperCase()}
                  </p>
                  <div className="flex items-start gap-2">
                    <p className="text-sm text-slate-600 font-mono break-all flex-1">
                      {request.wallet_address}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(request.id, request.wallet_address)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100"
                      title="Copy wallet address"
                    >
                      {copiedId === request.id ? '✓' : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleReject(request.id)}
                    disabled={processingId === request.id}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
