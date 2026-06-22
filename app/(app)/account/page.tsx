'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { TransactionModal } from '@/components/transaction-modal'
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Copy,
  Unlink,
  Link as LinkIcon,
  ArrowDownRight,
  ArrowUpLeft,
  Star,
} from 'lucide-react'

type LevelName = 'bronze' | 'silver' | 'gold' | 'platinum'

interface UserData {
  id: string
  username: string
  total_earnings: number
  total_points: number
}

interface LevelProgress {
  current_level: LevelName
  active_level_cycle_id: string | null
  highest_completed_level: LevelName
  progress_percentage: number
  total_tasks_completed: number
}

interface Transaction {
  id: string
  transaction_type: string
  amount: number
  description: string
  status: string
  created_at: string
}

interface Wallet {
  id: string
  wallet_type: string
  wallet_address: string
  is_linked: boolean
}

interface LevelPricing {
  level: LevelName
  price: number
}

const getWalletValidationError = (walletType: 'usdt' | 'btc', address: string) => {
  const trimmed = address.trim()
  if (!trimmed) return 'Wallet address is required'

  if (walletType === 'usdt') {
    if (!trimmed.startsWith('T') || trimmed.length < 30) {
      return 'USDT (TRC20) address should look like a Tron address starting with T'
    }
  }

  if (walletType === 'btc') {
    const lower = trimmed.toLowerCase()
    const looksLikeBtc = lower.startsWith('bc1') || trimmed.startsWith('1') || trimmed.startsWith('3')
    if (!looksLikeBtc || trimmed.length < 26) {
      return 'Bitcoin address should start with 1, 3, or bc1'
    }
  }

  return null
}

const isValidWalletRecord = (wallet: Wallet) => {
  if (!wallet.is_linked || !wallet.wallet_address) return false
  if (wallet.wallet_type !== 'usdt' && wallet.wallet_type !== 'btc') return false
  return !getWalletValidationError(wallet.wallet_type, wallet.wallet_address)
}

export default function AccountPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(true)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletModalType, setWalletModalType] = useState<'usdt' | 'btc' | null>(null)
  const [walletAddressInput, setWalletAddressInput] = useState('')
  const [walletSaving, setWalletSaving] = useState(false)
  const [walletError, setWalletError] = useState('')
  const [levelPricing, setLevelPricing] = useState<Record<LevelName, number>>({
    bronze: 0,
    silver: 15,
    gold: 50,
    platinum: 150,
  })
  const supabase = createClient()

  useEffect(() => {
    let cleanup: (() => void) | null = null

    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return

        const fetchUserRow = async () => {
          const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

          if (user) setUserData(user)
        }

        await fetchUserRow()

        // Fetch level progress
        const { data: level } = await supabase
          .from('level_progress')
          .select('current_level, active_level_cycle_id, highest_completed_level, progress_percentage, total_tasks_completed')
          .eq('user_id', authUser.id)
          .single()

        if (level) {
          setLevelProgress(level)
        }

        const { data: pricingRows } = await supabase
          .from('level_pricing')
          .select('level, price')

        if (pricingRows) {
          const nextPricing = { bronze: 0, silver: 15, gold: 50, platinum: 150 }
          for (const row of pricingRows as LevelPricing[]) {
            nextPricing[row.level] = Number(row.price)
          }
          setLevelPricing(nextPricing)
        }

        // Fetch transactions
        const { data: txns } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (txns) {
          setTransactions(txns)
        }

        // Fetch wallets
        const { data: userWallets } = await supabase
          .from('wallets')
          .select('*')
          .eq('user_id', authUser.id)

        if (userWallets) {
          setWallets(userWallets)
        }

        const intervalId = window.setInterval(() => {
          if (document.visibilityState !== 'visible') return
          fetchUserRow()
        }, 10000)

        const handleVisibility = () => {
          if (document.visibilityState === 'visible') fetchUserRow()
        }

        window.addEventListener('visibilitychange', handleVisibility)

        cleanup = () => {
          window.clearInterval(intervalId)
          window.removeEventListener('visibilitychange', handleVisibility)
        }
      } catch (error) {
        console.error('[v0] Error fetching account data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      cleanup?.()
    }
  }, [supabase])

  const refreshWallets = async (userId: string) => {
    const { data: userWallets } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)

    if (userWallets) {
      setWallets(userWallets)
    }
  }

  const openWalletEditor = (walletType: 'usdt' | 'btc') => {
    const existingWallet = wallets.find(
      (w) => w.wallet_type === walletType && isValidWalletRecord(w),
    )
    setWalletModalType(walletType)
    setWalletAddressInput(existingWallet?.wallet_address || '')
    setWalletError('')
    setShowWalletModal(true)
  }

  const handleSaveWallet = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      if (!walletModalType) return

      const validationError = getWalletValidationError(walletModalType, walletAddressInput)
      if (validationError) {
        setWalletError(validationError)
        return
      }

      setWalletSaving(true)
      setWalletError('')

      const existingWallet = wallets.find((w) => w.wallet_type === walletModalType)

      if (existingWallet) {
        const { error } = await supabase
          .from('wallets')
          .update({
            wallet_address: walletAddressInput.trim(),
            is_linked: true,
          })
          .eq('id', existingWallet.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('wallets').insert({
          user_id: authUser.id,
          wallet_type: walletModalType,
          wallet_address: walletAddressInput.trim(),
          is_linked: true,
        })

        if (error) throw error
      }

      await refreshWallets(authUser.id)
      setShowWalletModal(false)
      setWalletModalType(null)
      setWalletAddressInput('')
    } catch (error) {
      console.error('[v0] Error saving wallet:', error)
      setWalletError('Failed to save wallet. Please try again.')
    } finally {
      setWalletSaving(false)
    }
  }

  const handleUnlinkWallet = async (walletType: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const existingWallet = wallets.find((w) => w.wallet_type === walletType)
      if (!existingWallet) return

      await supabase.from('wallets').delete().eq('id', existingWallet.id)
      await refreshWallets(authUser.id)
    } catch (error) {
      console.error('[v0] Error unlinking wallet:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Deposits are now handled via QR codes in the modal - no action needed
  const handleWithdraw = async (amount: number, walletType: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) throw new Error('Not authenticated')

      // Check if user has sufficient balance
      if ((userData?.total_earnings || 0) < amount) {
        throw new Error('Insufficient balance')
      }

      // Get selected wallet
      const wallet = wallets.find(
        (w) => w.wallet_type === walletType && isValidWalletRecord(w),
      )
      if (!wallet) throw new Error('Please add a valid wallet address first')

      // Create withdrawal request
      const { error } = await supabase.from('withdrawal_requests').insert([
        {
          user_id: authUser.id,
          amount,
          wallet_type: walletType,
          wallet_address: wallet.wallet_address,
          status: 'pending',
        },
      ])

      if (error) throw error

      // Refresh transactions
      const { data: txns } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (txns) setTransactions(txns)
    } catch (error) {
      console.error('[v0] Withdrawal request error:', error)
      throw error
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading account...</p>
        </div>
      </div>
    )
  }

  const highestCompletedLevel = levelProgress?.highest_completed_level || 'bronze'
  const currentLevel = levelProgress?.current_level || 'bronze'
  const validWallets = wallets.filter(isValidWalletRecord)
  const hasWalletAccess = validWallets.length > 0
  const hasInvalidWalletRows = wallets.some((wallet) => !isValidWalletRecord(wallet))
  const levelOrder: Record<LevelName, number> = {
    bronze: 0,
    silver: 1,
    gold: 2,
    platinum: 3,
  }
  const nextUnlockLevel: LevelName =
    highestCompletedLevel === 'bronze'
      ? 'silver'
      : highestCompletedLevel === 'silver'
        ? 'gold'
        : 'platinum'
  const nextUnlockPrice = levelPricing[nextUnlockLevel]
  const nextUnlockLabel =
    highestCompletedLevel === 'platinum'
      ? 'Platinum can be purchased again'
      : `${nextUnlockLevel.charAt(0).toUpperCase()}${nextUnlockLevel.slice(1)} unlock`
  const progressionBadge =
    currentLevel !== 'bronze'
      ? `Active ${currentLevel} cycle`
      : highestCompletedLevel === 'platinum'
        ? 'Platinum unlocked'
        : `Next: ${nextUnlockLevel}`

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header with User Info */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-gray-700 rounded-xl p-4 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl md:text-3xl font-bold text-white">
                {userData?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {userData?.username}
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-yellow-400 bg-opacity-20 px-3 py-1 rounded-full border border-yellow-400 border-opacity-50">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-bold text-yellow-400">
                    {progressionBadge}
                  </span>
                </div>
                <p className="text-gray-400">
                  Active Level:{' '}
                  <span className="font-bold text-yellow-400 capitalize">
                    {currentLevel}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Total Earnings</p>
            <DollarSign className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-4xl font-bold text-yellow-400 mb-2">
            ${userData?.total_earnings?.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500">Available for withdrawal</p>
        </div>

        <div className="bg-slate-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Total Points</p>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-4xl font-bold text-purple-400 mb-2">
            {userData?.total_points || 0}
          </p>
          <p className="text-xs text-gray-500">Cumulative points earned</p>
        </div>

        <div className="bg-slate-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-400 text-sm">Next Unlock</p>
            <Star className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-4xl font-bold text-orange-400 mb-2">${nextUnlockPrice.toFixed(2)}</p>
          <p className="text-xs text-gray-500">{nextUnlockLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['bronze', 'silver', 'gold', 'platinum'] as LevelName[]).map((level) => {
          const isActive = currentLevel === level
          const isCompleted = level !== 'bronze' && levelOrder[highestCompletedLevel] >= levelOrder[level]
          const isRepeatable = level === 'platinum' && highestCompletedLevel === 'platinum'

          return (
            <div
              key={level}
              className={`rounded-xl border p-4 ${
                isActive
                  ? 'border-yellow-400 border-opacity-50 bg-yellow-400 bg-opacity-5'
                  : isCompleted
                    ? 'border-green-500 border-opacity-30 bg-green-500 bg-opacity-5'
                    : 'border-gray-700 bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-lg font-bold text-white capitalize">{level}</p>
                <span className="text-sm font-semibold text-yellow-400">${levelPricing[level].toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-400">
                {level === 'bronze'
                  ? 'Free starter tasks completed once'
                  : level === 'platinum'
                    ? 'Highest package, repeatable after completion'
                    : 'One-time progression package'}
              </p>
              <p className="mt-3 text-xs font-semibold">
                <span
                  className={
                    isActive
                      ? 'text-yellow-300'
                      : isCompleted
                        ? 'text-green-400'
                        : 'text-gray-500'
                  }
                >
                  {isActive
                    ? `Active cycle: ${levelProgress?.progress_percentage || 0}%`
                    : isCompleted
                      ? isRepeatable
                        ? 'Completed, can unlock again'
                        : 'Completed permanently'
                      : 'Locked'}
                </span>
              </p>
            </div>
          )
        })}
      </div>

      {/* Payment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={() => setShowDepositModal(true)}
          className="h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold hover:from-yellow-300 hover:to-yellow-400 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-yellow-400/30"
        >
          <DollarSign className="w-5 h-5" />
          Deposit (Recharge)
        </button>

        <button
          onClick={() => {
            if (!hasWalletAccess) return
            setShowWithdrawModal(true)
          }}
          disabled={!hasWalletAccess}
          className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:from-blue-500 hover:to-blue-600 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpLeft className="w-5 h-5" />
          Withdraw
        </button>
      </div>

      {!hasWalletAccess && (
        <div className="rounded-xl border border-yellow-500 border-opacity-30 bg-yellow-500 bg-opacity-5 px-4 py-3 text-sm text-yellow-200">
          Add at least one valid BTC or USDT wallet address before you can request a withdrawal.
        </div>
      )}

      {hasInvalidWalletRows && (
        <div className="rounded-xl border border-amber-500 border-opacity-30 bg-amber-500 bg-opacity-5 px-4 py-3 text-sm text-amber-200">
          Placeholder or invalid wallet data was hidden. Add your real wallet addresses below to continue.
        </div>
      )}

      {/* Linked Wallets */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Linked Wallets</h3>
        <div className="space-y-3">
          {['usdt', 'btc'].map((walletType, idx) => {
            const linkedWallet = validWallets.find((w) => w.wallet_type === walletType)
            const isLinked = linkedWallet?.is_linked

            return (
              <div
                key={walletType}
                className={`p-4 rounded-xl border transition-all ${
                  isLinked
                    ? 'bg-green-500 bg-opacity-5 border-green-500 border-opacity-30'
                    : 'bg-slate-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white capitalize">
                        {walletType === 'usdt' ? 'USDT (TRC20)' : 'Bitcoin (BTC)'}
                      </p>
                      {isLinked && linkedWallet ? (
                        <p className="text-xs text-gray-400">
                          {linkedWallet.wallet_address.slice(0, 10)}...
                          {linkedWallet.wallet_address.slice(-6)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500">Not linked</p>
                      )}
                    </div>
                  </div>

                  {isLinked && linkedWallet ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          copyToClipboard(linkedWallet.wallet_address)
                        }
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-gray-400 hover:text-gray-300 transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1 bg-green-500 bg-opacity-20 px-3 py-1 rounded-full border border-green-500 border-opacity-50">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <span className="text-xs font-semibold text-green-400">
                          Linked
                        </span>
                      </div>
                      <Button
                        onClick={() => openWalletEditor(walletType as 'usdt' | 'btc')}
                        variant="outline"
                        className="border-gray-600 text-gray-200 hover:bg-slate-700"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handleUnlinkWallet(walletType)}
                        variant="outline"
                        className="border-red-500 border-opacity-30 text-red-400 hover:bg-red-500 hover:bg-opacity-10"
                      >
                        <Unlink className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => openWalletEditor(walletType as 'usdt' | 'btc')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <LinkIcon className="w-4 h-4 mr-2" />
                      Add Wallet
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Transaction History</h3>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.length > 0 ? (
            transactions.map((txn) => {
              const isIncome = ['task_reward', 'deposit'].includes(
                txn.transaction_type
              )

              return (
                <div
                  key={txn.id}
                  className="p-4 bg-slate-800 border border-gray-700 rounded-lg hover:border-gray-600 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        isIncome
                          ? 'bg-green-500 bg-opacity-10 text-green-400'
                          : 'bg-red-500 bg-opacity-10 text-red-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <ArrowUpLeft className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <p className="font-semibold text-white capitalize">
                        {txn.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(txn.created_at).toLocaleDateString()}{' '}
                        {new Date(txn.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-lg font-bold ${
                        isIncome ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}${Math.abs(txn.amount || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {txn.status}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-center text-gray-400 py-8">
              No transactions yet
            </p>
          )}
        </div>
      </div>

      {/* Transaction Modals */}
      <TransactionModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        type="deposit"
        wallets={validWallets}
      />

      <TransactionModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        type="withdraw"
        onSubmit={handleWithdraw}
        wallets={validWallets}
      />

      {showWalletModal && walletModalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-60 backdrop-blur-sm"
            onClick={() => {
              if (walletSaving) return
              setShowWalletModal(false)
              setWalletModalType(null)
              setWalletError('')
            }}
          />
          <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-yellow-400 border-opacity-30 rounded-2xl p-6 w-full max-w-lg shadow-2xl shadow-yellow-400/10">
            <h2 className="text-2xl font-bold text-white mb-2">
              {walletModalType === 'usdt' ? 'Add USDT (TRC20) Wallet' : 'Add Bitcoin (BTC) Wallet'}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Paste your Binance destination wallet address for withdrawals.
            </p>

            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wallet Address
            </label>
            <input
              value={walletAddressInput}
              onChange={(e) => setWalletAddressInput(e.target.value)}
              placeholder={walletModalType === 'usdt' ? 'T...' : 'bc1... / 1... / 3...'}
              className="w-full px-4 py-2.5 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:border-yellow-400 focus:outline-none transition-all"
            />

            {walletError && (
              <div className="mt-3 p-3 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-50 rounded-lg">
                <p className="text-red-400 text-sm font-semibold">✗ {walletError}</p>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-gray-600 text-gray-200 hover:bg-slate-700"
                disabled={walletSaving}
                onClick={() => {
                  setShowWalletModal(false)
                  setWalletModalType(null)
                  setWalletError('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-semibold"
                disabled={walletSaving}
                onClick={handleSaveWallet}
              >
                {walletSaving ? 'Saving...' : 'Save Wallet'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
