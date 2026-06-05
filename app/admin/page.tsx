'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Wallet,
  ListTodo,
  LayoutDashboard,
  ArrowUpRight,
  Loader2,
  Settings,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<any>
  color: 'blue' | 'green' | 'purple' | 'orange'
  href?: string
}

const StatCard = ({ title, value, icon: Icon, color, href }: StatCardProps) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
        {href && (
          <Link href={href}>
            <Button variant="ghost" size="sm" className="gap-1 text-slate-500 hover:text-slate-700">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  )
}

export default function AdminOverview() {
  const [users, setUsers] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, withdrawalsRes, tasksRes] = await Promise.all([
          supabase.from('users').select('id'),
          supabase.from('withdrawal_requests').select('id, status'),
          supabase.from('tasks').select('id'),
        ])

        setUsers(usersRes.data || [])
        setWithdrawals(withdrawalsRes.data || [])
        setTasks(tasksRes.data || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
      </div>
    )
  }

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Overview</h1>
          <p className="text-slate-500 mt-1">Welcome back. Here's what's happening.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={users.length}
          icon={Users}
          color="blue"
          href="/admin/dashboard/users"
        />
        <StatCard
          title="Pending Withdrawals"
          value={pendingWithdrawals}
          icon={Wallet}
          color="orange"
          href="/admin/dashboard/withdrawals"
        />
        <StatCard
          title="Active Tasks"
          value={tasks.length}
          icon={ListTodo}
          color="purple"
          href="/admin/dashboard/tasks"
        />
        <StatCard
          title="Total Earnings"
          value="$15,230"
          icon={LayoutDashboard}
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Requires Action</h2>
          <Link href="/admin/dashboard/withdrawals">
            <Button variant="ghost" className="gap-1 text-slate-500 hover:text-slate-700">
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
        <div className="p-6">
          {pendingWithdrawals === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-500">All caught up! No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Pending Withdrawals</p>
                    <p className="text-sm text-slate-500">{pendingWithdrawals} requests waiting for approval</p>
                  </div>
                </div>
                <Link href="/admin/dashboard/withdrawals">
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                    Review
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
