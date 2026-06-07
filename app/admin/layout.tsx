'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Users,
  Wallet,
  DollarSign,
  ListTodo,
  Settings,
  LogOut,
  LogIn,
  Shield,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Music,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const isLoginRoute = pathname === '/admin/login'

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (isLoginRoute) {
          setIsLoading(false)
          return
        }

        console.log('🔹 [Admin Layout] Checking auth...')
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          console.log('❌ [Admin Layout] No authenticated user found')
          setIsLoading(false)
          return
        }

        console.log('✅ [Admin Layout] Authenticated user found:', authUser.id, authUser.email)
        setUser(authUser)

        // Check if user is in admin_users table
        console.log('🔹 [Admin Layout] Checking admin_users table for user:', authUser.id)
        const { data: adminCheck, error: adminError } = await supabase
          .from('admin_users')
          .select('id, user_id')
          .eq('user_id', authUser.id)
          .single()

        console.log('🔹 [Admin Layout] adminCheck result:', adminCheck)
        console.log('🔹 [Admin Layout] adminError:', adminError)

        if (!adminError && adminCheck) {
          console.log('✅ [Admin Layout] User IS an admin!')
          setIsAdmin(true)
        } else {
          console.log('❌ [Admin Layout] User is NOT an admin!')
        }
      } catch (error) {
        console.error('❌ [Admin Layout] Admin check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, isLoginRoute])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
    setUser(null)
    setMobileNavOpen(false)
    router.push('/')
  }

  const navItems = [
    { name: 'Overview', icon: LayoutDashboard, href: '/admin' },
    { name: 'Users', icon: Users, href: '/admin/users' },
    { name: 'Artists', icon: Music, href: '/admin/artists' },
    { name: 'Withdrawals', icon: Wallet, href: '/admin/withdrawals' },
    { name: 'Deposits', icon: DollarSign, href: '/admin/deposits' },
    { name: 'Tasks', icon: ListTodo, href: '/admin/tasks' },
    { name: 'Settings', icon: Settings, href: '/admin/settings' },
  ]

  if (isLoginRoute) {
    return children
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Admin Login Required</h2>
          <p className="text-slate-500 mb-8">Please log in with your admin account to access the dashboard.</p>
          <div className="space-y-3">
            <Button asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white">
              <Link href="/admin/login">
                <LogIn className="w-4 h-4 mr-2" />
                Go to Login
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Website
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500 mb-8">You are signed in, but you are not authorized as an admin.</p>
          <div className="space-y-3">
            <Button onClick={handleLogout} variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <Button asChild variant="outline" className="w-full border-slate-200 text-slate-600 hover:bg-slate-50">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Website
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden lg:flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-900 to-slate-700 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">SoundBridge Admin</h1>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${isActive
                    ? 'bg-slate-100 text-slate-900 border border-slate-200'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                `}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          <div className="px-4 py-3 bg-slate-50 rounded-xl">
            <p className="text-xs text-slate-400 font-medium mb-1">SIGNED IN AS</p>
            <p className="text-sm font-medium text-slate-700 truncate">{user.email}</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-slate-200 text-slate-600 hover:bg-slate-50 justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
              aria-label="Open admin navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Link href="/admin" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">SoundBridge Admin</h1>
            </Link>
          </div>

          <Link href="/" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg" aria-label="Back to website">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="p-6 lg:p-12">
          {children}
        </div>
      </main>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader className="p-4 border-b border-slate-200">
            <SheetTitle className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-slate-900 to-slate-700 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span>SoundBridge Admin</span>
            </SheetTitle>
            <SheetDescription>
              Navigate the admin dashboard.
            </SheetDescription>
          </SheetHeader>

          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/admin' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-slate-100 text-slate-900 border border-slate-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto p-4 border-t border-slate-200 space-y-2">
            <div className="px-4 py-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 font-medium mb-1">SIGNED IN AS</p>
              <p className="text-sm font-medium text-slate-700 truncate">{user?.email}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
