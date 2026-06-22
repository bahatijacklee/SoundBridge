'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Headphones, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      setSuccess('A password reset link has been sent to your email address.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email')
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

          <p className="text-center text-gray-400 text-sm mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Forgot Password</h2>
            <p className="text-gray-400">Reset your password securely</p>
          </div>

          <form onSubmit={handleResetRequest} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300 text-sm">
                Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
                />
              </div>
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
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
            >
              {isLoading ? 'Sending reset link...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
