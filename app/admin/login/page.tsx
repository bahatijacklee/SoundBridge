'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Shield, ArrowLeft } from 'lucide-react'

function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('next') || '/admin'

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
      router.push(redirectTo)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Website
        </Link>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-slate-700" />
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Admin Login
            </h2>
            <p className="text-slate-500">Sign in to manage the clinic.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-slate-700 text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@soundbridge.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-700 text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
            <div className="h-6 w-32 bg-slate-100 rounded mb-6 mx-auto" />
            <div className="space-y-3">
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-12 bg-slate-100 rounded mt-4" />
            </div>
          </div>
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  )
}
