'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Headphones } from 'lucide-react'

const getPasswordChecks = (value: string) => ({
  minLength: value.length >= 8,
  hasLowercase: /[a-z]/.test(value),
  hasUppercase: /[A-Z]/.test(value),
  hasNumber: /\d/.test(value),
  hasSpecialChar: /[^A-Za-z0-9]/.test(value),
})

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const passwordChecks = getPasswordChecks(password)
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length
  const isStrongPassword = Object.values(passwordChecks).every(Boolean)
  const passwordsMatch = repeatPassword.length === 0 || password === repeatPassword

  const strengthLabel =
    passedChecks <= 2 ? 'Weak' : passedChecks <= 4 ? 'Medium' : 'Strong'

  const strengthColor =
    passedChecks <= 2
      ? 'bg-red-500'
      : passedChecks <= 4
        ? 'bg-yellow-400'
        : 'bg-green-500'

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required')
      setIsLoading(false)
      return
    }

    if (!phoneNumber.trim()) {
      setError('Phone number is required')
      setIsLoading(false)
      return
    }

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!isStrongPassword) {
      setError(
        'Use a stronger password with at least 8 characters, uppercase, lowercase, number, and symbol',
      )
      setIsLoading(false)
      return
    }

    // Create username from first and last name
    const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`.replace(/\s+/g, '').replace(/[^a-z0-9.]/g, '')

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
            `${window.location.origin}/auth/callback`,
          data: {
            username,
            first_name: firstName,
            last_name: lastName,
            phone_number: phoneNumber.trim(),
          },
        },
      })

      if (signUpError) throw signUpError
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
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
              Join SoundBridge
            </h2>
            <p className="text-gray-400">
              Sign up and start supporting your favorite artists
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-gray-300 text-sm">
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-300 text-sm">
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-gray-300 text-sm">
                Phone Number
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
            </div>

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
              {password.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-5 gap-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <span
                        key={index}
                        className={`h-1.5 rounded-full ${index < passedChecks ? strengthColor : 'bg-slate-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-300">
                    Password strength: <span className="font-semibold">{strengthLabel}</span>
                  </p>
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
              <Label htmlFor="repeat-password" className="text-gray-300 text-sm">
                Confirm Password
              </Label>
              <Input
                id="repeat-password"
                type="password"
                placeholder="••••••••"
                required
                value={repeatPassword}
                onChange={(e) => setRepeatPassword(e.target.value)}
                className="mt-2 bg-slate-700 border-gray-600 text-white placeholder:text-gray-500 focus:border-yellow-400"
              />
              {repeatPassword.length > 0 && !passwordsMatch && (
                <p className="mt-2 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !isStrongPassword || !passwordsMatch}
              className="w-full mt-6 bg-linear-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all"
            >
              {isLoading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300">
              Log in
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
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
