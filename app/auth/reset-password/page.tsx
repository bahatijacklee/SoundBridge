'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Headphones, LockKeyhole } from 'lucide-react'

const getPasswordChecks = (value: string) => ({
  minLength: value.length >= 8,
  hasLowercase: /[a-z]/.test(value),
  hasUppercase: /[A-Z]/.test(value),
  hasNumber: /\d/.test(value),
  hasSpecialChar: /[^A-Za-z0-9]/.test(value),
})

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [canReset, setCanReset] = useState(false)

  const passwordChecks = getPasswordChecks(password)
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length
  const isStrongPassword = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = confirmPassword.length === 0 || password === confirmPassword

  useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()

      if (!mounted) return

      if (data.session) {
        setCanReset(true)
      }

      setIsCheckingSession(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return

      if (event === 'PASSWORD_RECOVERY' || !!session) {
        setCanReset(true)
      }
      setIsCheckingSession(false)
    })

    void checkSession()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!isStrongPassword) {
      setError(
        'Use a stronger password with at least 8 characters, uppercase, lowercase, number, and symbol',
      )
      return
    }

    setIsLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

      if (updateError) throw updateError

      setSuccess('Your password has been updated successfully. Redirecting to login...')
      await supabase.auth.signOut()

      window.setTimeout(() => {
        router.push('/auth/login')
      }, 1800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-800 bg-opacity-80 backdrop-blur-md border border-yellow-500 border-opacity-30 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <Headphones className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">SoundBridge</h1>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            <p className="text-gray-400">Choose a new secure password for your account</p>
          </div>

          {isCheckingSession ? (
            <div className="py-8 text-center text-gray-400">Checking reset session...</div>
          ) : !canReset ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-sm text-red-400">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
              </div>
              <Link href="/auth/forgot-password" className="block">
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all">
                  Request New Reset Link
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-gray-300 text-sm">
                  New Password
                </Label>
                <div className="relative mt-2">
                  <LockKeyhole className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
                  />
                </div>
                {password.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="grid grid-cols-5 gap-1">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <span
                          key={index}
                          className={`h-1.5 rounded-full ${
                            index < passedChecks
                              ? passedChecks <= 2
                                ? 'bg-red-500'
                                : passedChecks <= 4
                                  ? 'bg-yellow-400'
                                  : 'bg-green-500'
                              : 'bg-slate-600'
                          }`}
                        />
                      ))}
                    </div>
                    <ul className="space-y-1 text-xs text-gray-400">
                      <li className={passwordChecks.minLength ? 'text-green-400' : 'text-gray-400'}>
                        At least 8 characters
                      </li>
                      <li className={passwordChecks.hasLowercase ? 'text-green-400' : 'text-gray-400'}>
                        At least one lowercase letter
                      </li>
                      <li className={passwordChecks.hasUppercase ? 'text-green-400' : 'text-gray-400'}>
                        At least one uppercase letter
                      </li>
                      <li className={passwordChecks.hasNumber ? 'text-green-400' : 'text-gray-400'}>
                        At least one number
                      </li>
                      <li className={passwordChecks.hasSpecialChar ? 'text-green-400' : 'text-gray-400'}>
                        At least one symbol
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirm-password" className="text-gray-300 text-sm">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
                />
                {!passwordsMatch && (
                  <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-500 bg-opacity-10 border border-green-500 rounded-lg">
                  <p className="text-sm text-green-400">{success}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !passwordsMatch}
                className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
              >
                {isLoading ? 'Updating password...' : 'Update Password'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
