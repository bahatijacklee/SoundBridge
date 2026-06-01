'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Heart, UserPlus, BookOpen, ShoppingBag, CheckCircle, Lock } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  task_type: string
  reward_amount: number
  reward_points: number
  artist_id: string | null
  required_level: string | null
  isLocked?: boolean
}

interface Artist {
  id: string
  name: string
  image_url: string
}

interface CompletedTask {
  task_id: string
  completion_date: string
}

interface UserStats {
  total_earnings: number
  total_points: number
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  follow: <UserPlus className="w-6 h-6" />,
  like: <Heart className="w-6 h-6" />,
  read_bio: <BookOpen className="w-6 h-6" />,
  buy_card: <ShoppingBag className="w-6 h-6" />,
}

const TASK_COLORS: Record<string, string> = {
  follow: 'from-blue-600 to-blue-700',
  like: 'from-red-600 to-red-700',
  read_bio: 'from-purple-600 to-purple-700',
  buy_card: 'from-green-600 to-green-700',
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [artists, setArtists] = useState<Record<string, Artist>>({})
  const [completedToday, setCompletedToday] = useState<CompletedTask[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [isVip, setIsVip] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('reward')
  const supabase = createClient()

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const date = new Date()
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) return

        // Fetch user VIP status
        const { data: userData } = await supabase
          .from('users')
          .select('is_vip')
          .eq('id', authUser.id)
          .single()

        if (userData) {
          setIsVip(userData.is_vip)
        }

        // Fetch all tasks
        const { data: tasksData } = await supabase
          .from('tasks')
          .select('*')
          .order('reward_amount', { ascending: false })

        if (tasksData) {
          setTasks(tasksData)

          // Fetch artist details for tasks
          const artistIds = [...new Set(tasksData.map((t) => t.artist_id))].filter(
            (id) => id !== null
          )

          if (artistIds.length > 0) {
            const { data: artistData } = await supabase
              .from('artists')
              .select('*')
              .in('id', artistIds)

            if (artistData) {
              const artistMap = artistData.reduce(
                (acc, artist) => {
                  acc[artist.id] = artist
                  return acc
                },
                {} as Record<string, Artist>
              )
              setArtists(artistMap)
            }
          }
        }

        // Fetch today's completed tasks
        const todayDate = getTodayDate()
        const { data: completed } = await supabase
          .from('user_tasks')
          .select('task_id, completion_date')
          .eq('user_id', authUser.id)
          .eq('completion_date', todayDate)

        if (completed) {
          setCompletedToday(completed)
        }

        // Fetch user stats
        const { data: user } = await supabase
          .from('users')
          .select('total_earnings, total_points')
          .eq('id', authUser.id)
          .single()

        if (user) {
          setUserStats(user)
        }
      } catch (error) {
        console.error('[v0] Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase])

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      const task = tasks.find((t) => t.id === taskId)
      if (!task) return

      const todayDate = getTodayDate()

      // Mark task as completed for today
      const { error } = await supabase.from('user_tasks').insert({
        user_id: authUser.id,
        task_id: taskId,
        earned_amount: task.reward_amount,
        earned_points: task.reward_points,
        completion_date: todayDate,
      })

      if (!error) {
        // Update user earnings (accumulative - adds to total, never resets)
        const currentStats = userStats || { total_earnings: 0, total_points: 0 }
        const newEarnings = currentStats.total_earnings + task.reward_amount
        const newPoints = currentStats.total_points + task.reward_points

        await supabase
          .from('users')
          .update({
            total_earnings: newEarnings,
            total_points: newPoints,
          })
          .eq('id', authUser.id)

        // Update local stats
        setUserStats({
          total_earnings: newEarnings,
          total_points: newPoints,
        })

        // Refresh today's completed tasks
        const { data: updated } = await supabase
          .from('user_tasks')
          .select('task_id, completion_date')
          .eq('user_id', authUser.id)
          .eq('completion_date', todayDate)

        if (updated) {
          setCompletedToday(updated)
        }
      }
    } catch (error) {
      console.error('[v0] Error completing task:', error)
    }
  }

  // Organize tasks by level and VIP status
  // If required_level is not set, determine by reward amount
  const enrichedTasks = tasks.map((task, index) => {
    let level = task.required_level || 'bronze'
    
    // If no explicit level, assign based on reward amount
    if (!task.required_level) {
      if (task.reward_amount < 10) {
        level = 'bronze'
      } else if (task.reward_amount < 20) {
        level = 'silver'
      } else if (task.reward_amount < 50) {
        level = 'gold'
      } else {
        level = 'platinum'
      }
    }
    return { ...task, required_level: level }
  })

  const bronzeTasks = enrichedTasks.filter(
    (task) => task.required_level === 'bronze'
  )
  
  const vipLockedTasks = enrichedTasks.filter(
    (task) =>
      task.required_level && 
      ['silver', 'gold', 'platinum'].includes(task.required_level)
  )

  // Limit free tasks to 3 for non-VIP users
  const displayedBronzeTasks = isVip ? bronzeTasks : bronzeTasks.slice(0, 3)

  // Create task list with lock state
  const allDisplayedTasks = isVip
    ? enrichedTasks.map((task) => ({ ...task, isLocked: false }))
    : [
        ...displayedBronzeTasks.map((task) => ({ ...task, isLocked: false })),
        ...vipLockedTasks.map((task) => ({ ...task, isLocked: true })),
      ]

  const sortedTasks = allDisplayedTasks.sort((a, b) => {
    switch (sortBy) {
      case 'reward':
        return b.reward_amount - a.reward_amount
      case 'points':
        return b.reward_points - a.reward_points
      case 'type':
        return a.task_type.localeCompare(b.task_type)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* VIP Status Banner */}
      {!isVip && (
        <div className="bg-gradient-to-r from-amber-900 to-orange-900 border-2 border-amber-600 border-opacity-50 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-200 font-bold text-sm md:text-base mb-1">
                Free Plan - Limited Access
              </p>
              <p className="text-amber-100 text-xs md:text-sm">
                You have access to <span className="font-bold">{displayedBronzeTasks.length} of {bronzeTasks.length}</span> free tasks daily. 
                Unlock all tasks and higher rewards with <span className="font-bold">VIP membership</span>!
              </p>
            </div>
            <Lock className="w-6 h-6 md:w-8 md:h-8 text-amber-400 flex-shrink-0" />
          </div>
        </div>
      )}

      {isVip && (
        <div className="bg-gradient-to-r from-yellow-900 to-amber-900 border-2 border-yellow-500 border-opacity-50 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-200 font-bold text-sm md:text-base mb-1">
                VIP Member ✨
              </p>
              <p className="text-yellow-100 text-xs md:text-sm">
                You have unlimited access to all tasks and exclusive rewards!
              </p>
            </div>
            <div className="text-3xl">👑</div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
        {[
          { label: 'Most Rewarding', value: 'reward' },
          { label: 'Most Points', value: 'points' },
          { label: 'By Type', value: 'type' },
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
              sortBy === option.value
                ? 'bg-yellow-400 text-slate-900 font-bold'
                : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedTasks.map((task) => {
          const isCompletedToday = completedToday.some((ct) => ct.task_id === task.id)
          const artist = task.artist_id ? artists[task.artist_id] : null

          return (
            <div
              key={task.id}
              className={`border rounded-xl p-4 md:p-6 transition-all ${
                isCompletedToday
                  ? 'border-green-500 border-opacity-30 bg-green-500 bg-opacity-5'
                  : task.isLocked
                    ? 'border-gray-600 border-opacity-50 bg-slate-800 bg-opacity-40'
                    : 'border-gray-700 bg-slate-800 hover:border-yellow-400 hover:border-opacity-50'
              }`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                {/* Icon */}
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${TASK_COLORS[task.task_type]} text-white flex-shrink-0`}
                >
                  {TASK_ICONS[task.task_type]}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-bold text-white break-words">
                        {task.title}
                      </h3>
                      {artist && (
                        <p className="text-xs md:text-sm text-gray-400 truncate">
                          Artist:{' '}
                          <span className="font-semibold text-white">
                            {artist.name}
                          </span>
                        </p>
                      )}
                    </div>

                    {isCompletedToday && (
                      <div className="flex items-center gap-1 bg-green-500 bg-opacity-20 px-2 py-1 rounded-full border border-green-500 border-opacity-50 flex-shrink-0 text-nowrap mt-1 sm:mt-0">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">
                          Today
                        </span>
                      </div>
                    )}
                  </div>

                  {task.description && (
                    <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}

                  {/* Rewards */}
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-3">
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-xl md:text-2xl font-bold text-yellow-400">
                        ${task.reward_amount.toFixed(2)}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">USD</span>
                    </div>
                    <div className="w-px h-5 md:h-6 bg-gray-700"></div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <span className="text-base md:text-lg font-bold text-purple-400">
                        +{task.reward_points}
                      </span>
                      <span className="text-xs md:text-sm text-gray-500">PTS</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  {task.required_level && (
                    <p className="text-xs text-gray-500 mb-3">
                      Requires: {task.required_level.toUpperCase()} level or higher
                    </p>
                  )}

                  {/* Action Button */}
                  <div className="relative group">
                    <button
                      onClick={() => !task.isLocked && handleCompleteTask(task.id)}
                      disabled={isCompletedToday || task.isLocked}
                      className={`w-full font-bold py-2 md:py-2.5 text-sm md:text-base rounded-lg transition-all ${
                        task.isLocked
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                          : isCompletedToday
                            ? 'bg-green-600 hover:bg-green-700 text-white cursor-not-allowed opacity-75'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:shadow-lg'
                      }`}
                    >
                      {task.isLocked ? 'VIP Only' : isCompletedToday ? 'Completed Today' : 'Complete Task'}
                    </button>
                    {/* Hover Tooltip for Locked Tasks */}
                    {task.isLocked && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 md:px-3 py-1 md:py-2 bg-slate-800 border border-amber-500 border-opacity-50 rounded-lg text-xs text-white font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        Upgrade to VIP to unlock
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No tasks available</p>
        </div>
      )}
    </div>
  )
}
