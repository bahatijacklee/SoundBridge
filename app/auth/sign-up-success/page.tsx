'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Headphones, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
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

          {/* Success Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <Mail className="w-10 h-10 text-slate-900" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-3">
              Check Your Email
            </h2>
            <p className="text-gray-400 mb-4">
              We&apos;ve sent you a confirmation link to verify your email address. Click the link in the email to complete your signup.
            </p>
            <p className="text-gray-500 text-sm">
              Check your spam folder if you don&apos;t see the email within a few minutes.
            </p>
          </div>

          {/* Action Button */}
          <Link href="/auth/login" className="block w-full">
            <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-900 font-bold py-2 rounded-lg hover:from-yellow-300 hover:to-yellow-400 transition-all">
              Back to Login
            </Button>
          </Link>

          {/* Help Text */}
          <p className="mt-6 text-xs text-gray-500 text-center">
            Didn&apos;t receive the email?{' '}
            <button className="text-yellow-400 hover:text-yellow-300">
              Resend it
            </button>
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
