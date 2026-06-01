'use client'

import { useState } from 'react'
import { X, DollarSign, ArrowUpLeft } from 'lucide-react'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'deposit' | 'withdraw'
  onSubmit: (amount: number, description: string) => Promise<void>
}

export function TransactionModal({
  isOpen,
  onClose,
  type,
  onSubmit,
}: TransactionModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const isDeposit = type === 'deposit'
  const title = isDeposit ? 'Deposit (Recharge)' : 'Withdraw Funds'
  const buttonColor = isDeposit
    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 hover:from-yellow-300 hover:to-yellow-400'
    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setLoading(true)
    try {
      await onSubmit(Number(amount), description)
      setSuccess(true)
      setAmount('')
      setDescription('')

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-yellow-400 border-opacity-30 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl shadow-yellow-400/10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-all"
        >
          <X className="w-5 h-5 text-gray-400 hover:text-white" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          {isDeposit ? (
            <div className="w-10 h-10 bg-yellow-400 bg-opacity-10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-400" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-blue-500 bg-opacity-10 rounded-lg flex items-center justify-center">
              <ArrowUpLeft className="w-6 h-6 text-blue-400" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-sm text-gray-400">
              {isDeposit
                ? 'Add funds to your account'
                : 'Withdraw your earnings'}
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-50 rounded-lg">
            <p className="text-green-400 font-semibold">
              ✓ {isDeposit ? 'Deposit' : 'Withdrawal'} initiated successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-50 rounded-lg">
            <p className="text-red-400 font-semibold">✗ {error}</p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Amount Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reference / Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Bonus top-up, Weekly earnings"
                className="w-full px-4 py-2.5 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none transition-all"
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-500 bg-opacity-5 border border-blue-500 border-opacity-20 rounded-lg">
              <p className="text-xs text-blue-300 leading-relaxed">
                {isDeposit
                  ? '💳 Deposit will be processed via secure payment gateway (coming soon)'
                  : '🔒 Withdrawal will be sent to your linked wallet account'}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold uppercase tracking-wider transition-all ${buttonColor} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : isDeposit ? (
                `Deposit $${amount || '0.00'}`
              ) : (
                `Withdraw $${amount || '0.00'}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
