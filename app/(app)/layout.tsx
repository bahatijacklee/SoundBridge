'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Home,
  Music,
  CheckSquare,
  User,
  Settings,
  LogOut,
  Diamond,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'

interface User {
  id: string
  email: string
  username: string
  avatar_url: string | null
  is_vip: boolean
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profile) {
          setUser({
            id: profile.id,
            email: authUser.email || '',
            username: profile.username,
            avatar_url: profile.avatar_url,
            is_vip: profile.is_vip,
          })
        }
      } catch (error) {
        console.error('[v0] Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { name: 'Home', icon: Home, href: '/home' },
    { name: 'Artists', icon: Music, href: '/artists' },
    { name: 'Tasks', icon: CheckSquare, href: '/tasks' },
    { name: 'Account', icon: User, href: '/account' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ]

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-950 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden border-b border-gray-800 bg-slate-900 sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <Link href="/home" className="flex items-center gap-2 hover:opacity-80">
          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-slate-900" />
          </div>
          <span className="text-lg font-bold text-white">SoundBridge</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-gray-300 hover:bg-slate-800 rounded-lg transition-all"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-14"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile Menu - Compact Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed left-0 top-0 right-0 bottom-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      <nav className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-gray-800 flex flex-col transition-all duration-300 z-40 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Mobile Menu Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <Music className="w-5 h-5 text-slate-900" />
            </div>
            <span className="font-bold text-white">Menu</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Navigation Links */}
        <div className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-yellow-500 text-white'
                    : 'text-gray-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>

        {/* Mobile Logout */}
        {user && (
          <div className="p-4 border-t border-gray-800">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 border-opacity-30 text-red-400 hover:bg-red-500 hover:bg-opacity-10 text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-slate-900 border-r border-gray-800 flex-col overflow-y-auto">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
              <Music className="w-6 h-6 text-slate-900" />
            </div>
            <span className="text-xl font-bold text-white">SoundBridge</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-slate-800 border border-yellow-400 border-opacity-50 text-yellow-400'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-800 space-y-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.username}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              {user.is_vip && (
                <Diamond className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              )}
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-red-500 border-opacity-30 text-red-400 hover:bg-red-500 hover:bg-opacity-10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        )}

        {/* VIP Section */}
        {!user?.is_vip && (
          <div className="px-4 pb-4">
            <div className="p-5 bg-gradient-to-br from-yellow-600 via-yellow-500 to-amber-600 rounded-2xl border-2 border-yellow-300 border-opacity-60 shadow-2xl shadow-yellow-500/20 relative overflow-hidden group hover:shadow-yellow-500/40 transition-all">
              {/* Premium Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              {/* Crown Icon */}
              <div className="flex justify-center mb-3 relative z-10">
                <div className="w-14 h-14 relative">
                  <Image
                    src="/crown.png"
                    alt="VIP Crown"
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 text-center">
                <span className="font-black text-white text-base uppercase tracking-widest drop-shadow-lg">
                  Unlock VIP
                </span>
                <p className="text-xs text-white/90 mt-2 font-medium leading-relaxed">
                  Premium rewards, exclusive benefits & priority support
                </p>
              </div>

              {/* Button */}
              <button className="w-full mt-4 relative z-10 bg-slate-900 hover:bg-slate-800 text-yellow-300 font-black py-2.5 rounded-xl text-sm uppercase tracking-wider transition-all border border-yellow-200 border-opacity-30 hover:border-opacity-60 shadow-lg">
                Upgrade Now
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* Top Bar - Desktop Only */}
        <div className="hidden md:flex border-b border-gray-800 bg-slate-900 sticky top-0 z-40 px-8 py-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            {navItems.find((item) => pathname.startsWith(item.href))?.name ||
              'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-300 hover:bg-slate-800 rounded-lg transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-4 md:py-8">{children}</div>
      </main>
    </div>
  )
}
