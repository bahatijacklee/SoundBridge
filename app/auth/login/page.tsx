'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Headphones } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError
      router.push('/home')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-800 bg-opacity-80 backdrop-blur-md border border-yellow-500 border-opacity-30 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <Headphones className="w-8 h-8 text-yellow-400" />
              <h1 className="text-2xl font-bold text-white">SoundBridge</h1>
            </div>
          </div>

          <p className="text-center text-gray-400 text-sm mb-6">
            Connecting Sound. Creating Opportunity.
          </p>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400">Log in to your SoundBridge account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300 text-sm">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-gray-300 text-sm">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Don&apos;t have an account?{' '}
            <Link href="/auth/sign-up" className="text-yellow-400 hover:text-yellow-300">
              Sign up
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            <Link href="/auth/forgot-password" className="text-yellow-400 hover:text-yellow-300">
              Forgot your password?
            </Link>
          </p>
        </div>

        {/* Support info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Need help? Contact us at customer@soundbridge.com</p>
          <p className="mt-2">© 2024 SoundBridge Inc. All rights reserved</p>
        </div>
      </div>
    </div>
  )
}
