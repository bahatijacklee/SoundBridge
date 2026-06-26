'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, UserPlus, BookOpen, ShoppingBag, CheckCircle, Lock, Loader2, DollarSign } from 'lucide-react'

type LevelName = 'bronze' | 'silver' | 'gold' | 'platinum'

interface Task {
  id: string
  title: string
  description: string
  task_type: string
  reward_amount: number
  reward_points: number
  artist_id: string | null
  required_level: string | null
}

interface Artist {
  id: string
  name: string
  image_url: string
}

interface UserTask {
  task_id: string
  task_level: string | null
  level_cycle_id: string | null
}

interface UserStats {
  total_earnings: number
  total_points: number
}

interface LevelProgress {
  current_level: LevelName
  active_level_cycle_id: string | null
  highest_completed_level: LevelName
  silver_cycles_completed: number
  gold_cycles_completed: number
  platinum_cycles_completed: number
  progress_percentage: number
  total_tasks_completed: number
}

interface LevelPricing {
  level: LevelName
  price: number
}

const LEVELS: LevelName[] = ['bronze', 'silver', 'gold', 'platinum']
const LEVEL_LIMITS: Record<Exclude<LevelName, 'bronze'>, number | null> = {
  silver: 3,
  gold: 2,
  platinum: null,
}

const TASK_ICONS: Record<string, ReactNode> = {
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

const LEVEL_CARD_COLORS: Record<LevelName, string> = {
  bronze: 'from-amber-700 to-amber-800',
  silver: 'from-slate-400 to-slate-500',
  gold: 'from-yellow-500 to-yellow-600',
  platinum: 'from-cyan-500 to-sky-600',
}

export default function TasksPage() {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [artists, setArtists] = useState<Record<string, Artist>>({})
  const [completedTasks, setCompletedTasks] = useState<UserTask[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress>({
    current_level: 'bronze',
    active_level_cycle_id: null,
    highest_completed_level: 'bronze',
    silver_cycles_completed: 0,
    gold_cycles_completed: 0,
    platinum_cycles_completed: 0,
    progress_percentage: 0,
    total_tasks_completed: 0,
  })
  const [levelPricing, setLevelPricing] = useState<Record<LevelName, number>>({
    bronze: 0,
    silver: 15,
    gold: 50,
    platinum: 150,
  })
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('reward')
  const [actionError, setActionError] = useState<string | null>(null)
  const [processingTaskId, setProcessingTaskId] = useState<string | null>(null)
  const [processingLevel, setProcessingLevel] = useState<LevelName | null>(null)

  const fetchData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) return

      const [tasksRes, userTasksRes, userRes, levelRes, pricingRes] = await Promise.all([
        supabase.from('tasks').select('*').order('reward_amount', { ascending: false }),
        supabase.from('user_tasks').select('task_id, task_level, level_cycle_id').eq('user_id', authUser.id),
        supabase.from('users').select('total_earnings, total_points').eq('id', authUser.id).single(),
        supabase
          .from('level_progress')
          .select('current_level, active_level_cycle_id, highest_completed_level, silver_cycles_completed, gold_cycles_completed, platinum_cycles_completed, progress_percentage, total_tasks_completed')
          .eq('user_id', authUser.id)
          .maybeSingle(),
        supabase.from('level_pricing').select('level, price'),
      ])

      if (tasksRes.error) throw tasksRes.error
      if (userTasksRes.error) throw userTasksRes.error
      if (userRes.error) throw userRes.error
      if (levelRes.error) throw levelRes.error
      if (pricingRes.error) throw pricingRes.error

      const tasksData = (tasksRes.data as Task[]) || []
      setTasks(tasksData)
      setCompletedTasks((userTasksRes.data as UserTask[]) || [])
      setUserStats(userRes.data as UserStats)

      if (levelRes.data) {
        setLevelProgress(levelRes.data as LevelProgress)
      } else {
        setLevelProgress({
          current_level: 'bronze',
          active_level_cycle_id: null,
          highest_completed_level: 'bronze',
          silver_cycles_completed: 0,
          gold_cycles_completed: 0,
          platinum_cycles_completed: 0,
          progress_percentage: 0,
          total_tasks_completed: 0,
        })
      }

      if (pricingRes.data) {
        const pricingMap = { bronze: 0, silver: 15, gold: 50, platinum: 150 }
        for (const row of pricingRes.data as LevelPricing[]) {
          pricingMap[row.level] = Number(row.price)
        }
        setLevelPricing(pricingMap)
      }

      const artistIds = [...new Set(tasksData.map((task) => task.artist_id).filter(Boolean))]
      if (artistIds.length > 0) {
        const { data: artistData, error: artistError } = await supabase
          .from('artists')
          .select('*')
          .in('id', artistIds)

        if (artistError) throw artistError

        const artistMap = ((artistData as Artist[]) || []).reduce(
          (acc, artist) => {
            acc[artist.id] = artist
            return acc
          },
          {} as Record<string, Artist>,
        )

        setArtists(artistMap)
      } else {
        setArtists({})
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      setActionError('Failed to load tasks and levels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [supabase])

  const normalizedTasks = useMemo(
    () =>
      tasks.map((task) => ({
        ...task,
        required_level: (task.required_level?.toLowerCase() || 'bronze') as LevelName,
      })),
    [tasks],
  )

  const bronzeCompletedIds = useMemo(
    () =>
      new Set(
        completedTasks
          .filter((task) => (task.task_level?.toLowerCase() || 'bronze') === 'bronze')
          .map((task) => task.task_id),
      ),
    [completedTasks],
  )

  const activeLevelCompletedIds = useMemo(
    () =>
      new Set(
        completedTasks
          .filter(
            (task) =>
              task.level_cycle_id &&
              task.level_cycle_id === levelProgress.active_level_cycle_id &&
              task.task_level?.toLowerCase() === levelProgress.current_level,
          )
          .map((task) => task.task_id),
      ),
    [completedTasks, levelProgress.active_level_cycle_id, levelProgress.current_level],
  )

  const activeLevelTaskCount = normalizedTasks.filter(
    (task) => task.required_level === levelProgress.current_level && task.required_level !== 'bronze',
  ).length

  const remainingActiveLevelTasks =
    levelProgress.current_level === 'bronze'
      ? 0
      : Math.max(activeLevelTaskCount - activeLevelCompletedIds.size, 0)

  const getCompletedCycles = (level: LevelName) => {
    if (level === 'silver') return levelProgress.silver_cycles_completed || 0
    if (level === 'gold') return levelProgress.gold_cycles_completed || 0
    if (level === 'platinum') return levelProgress.platinum_cycles_completed || 0
    return bronzeCompletedIds.size > 0 ? 1 : 0
  }

  const canPurchaseLevel = (level: LevelName) => {
    if (level === 'bronze' || levelProgress.current_level !== 'bronze') return false
    if (level === 'silver') return getCompletedCycles('silver') < 3
    if (level === 'gold') return getCompletedCycles('silver') >= 3 && getCompletedCycles('gold') < 2
    return getCompletedCycles('gold') >= 2
  }

  const sortedTasks = [...normalizedTasks].sort((a, b) => {
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

  const handleCompleteTask = async (taskId: string) => {
    try {
      setActionError(null)
      setProcessingTaskId(taskId)
      const { error } = await supabase.rpc('complete_task', { p_task_id: taskId })
      if (error) throw error
      await fetchData()
    } catch (error: any) {
      console.error('Error completing task:', error)
      setActionError(error?.message || 'Failed to complete task')
    } finally {
      setProcessingTaskId(null)
    }
  }

  const handlePurchaseLevel = async (level: LevelName) => {
    try {
      setActionError(null)
      setProcessingLevel(level)
      const { error } = await supabase.rpc('purchase_task_level', { p_level: level })
      if (error) throw error
      await fetchData()
    } catch (error: any) {
      console.error('Error purchasing level:', error)
      setActionError(error?.message || 'Failed to unlock level')
    } finally {
      setProcessingLevel(null)
    }
  }

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
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 border border-yellow-500 border-opacity-30 rounded-xl p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">Current active level</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white capitalize">
              {levelProgress.current_level}
            </h2>
            <p className="text-sm text-gray-300 mt-2">
              You&apos;re currently at the {levelProgress.current_level} level. Keep climbing!
            </p>
          </div>
          <div className="bg-slate-900 bg-opacity-60 rounded-xl px-5 py-4">
            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Available balance</p>
            <p className="text-3xl font-bold text-yellow-400">
              ${Number(userStats?.total_earnings || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {LEVELS.map((level) => {
          const price = levelPricing[level] ?? 0
          const isActive = levelProgress.current_level === level
          const balance = Number(userStats?.total_earnings || 0)
          const canPurchase = canPurchaseLevel(level)
          const hasEnoughBalance = balance >= price
          const completedCycles = getCompletedCycles(level)
          const cycleLimit = level === 'bronze' ? 1 : LEVEL_LIMITS[level]
          const hasReachedLimit = level !== 'bronze' && cycleLimit !== null && completedCycles >= cycleLimit

          return (
            <div
              key={level}
              className={`rounded-xl border p-5 ${
                isActive
                  ? 'border-yellow-400 border-opacity-60 bg-yellow-500 bg-opacity-5'
                  : 'border-gray-700 bg-slate-800'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${LEVEL_CARD_COLORS[level]} flex items-center justify-center mb-4`}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-white capitalize">{level}</h3>
                <span className="text-yellow-400 font-bold">${price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                {level === 'bronze'
                  ? 'Start here'
                  : isActive
                    ? 'Tasks unlocked'
                    : canPurchase
                      ? 'Pay to unlock'
                      : hasReachedLimit
                        ? 'Level completed'
                        : 'Complete the previous level to unlock'}
              </p>

              {level === 'bronze' ? (
                <div className="rounded-lg bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 px-3 py-2 text-sm text-green-400">
                  Always available
                </div>
              ) : isActive ? (
                <div className="rounded-lg bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 px-3 py-2 text-sm text-yellow-300">
                  Tasks unlocked
                </div>
              ) : hasReachedLimit ? (
                <div className="rounded-lg bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 px-3 py-2 text-sm text-green-300">
                  Completed
                </div>
              ) : canPurchase ? (
                <button
                  type="button"
                  onClick={() => handlePurchaseLevel(level)}
                  disabled={processingLevel === level || !hasEnoughBalance}
                  className={`w-full rounded-lg py-2.5 font-bold transition-all ${
                    hasEnoughBalance
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-slate-900'
                      : 'bg-slate-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {processingLevel === level
                    ? 'Unlocking...'
                    : hasEnoughBalance
                      ? `Unlock ${level}`
                      : `Need $${(price - balance).toFixed(2)} more`}
                </button>
              ) : (
                <div className="rounded-lg bg-slate-700 px-3 py-2 text-sm text-gray-300">
                  {levelProgress.current_level !== 'bronze'
                    ? 'Finish your current level first'
                    : 'Complete the previous level to unlock'}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {levelProgress.current_level !== 'bronze' && (
        <div className="bg-gradient-to-r from-purple-900 to-slate-900 border border-purple-500 border-opacity-40 rounded-xl p-4 md:p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-purple-200 capitalize">
                {levelProgress.current_level} level is active
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Complete all tasks in this level to lock it again and return to Bronze automatically.
              </p>
            </div>
            <div className="min-w-40">
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all"
                  style={{ width: `${levelProgress.progress_percentage || 0}%` }}
                />
              </div>
              <p className="text-xs text-right text-gray-300 mt-2">
                {levelProgress.total_tasks_completed}/{activeLevelTaskCount} completed
              </p>
            </div>
          </div>
        </div>
      )}

      {actionError ? (
        <div className="rounded-xl border border-red-500 border-opacity-40 bg-red-500 bg-opacity-10 px-4 py-3 text-sm text-red-300">
          {actionError}
        </div>
      ) : null}

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sortedTasks.map((task) => {
          const taskLevel = task.required_level as LevelName
          const isBronze = taskLevel === 'bronze'
          const isCompleted = isBronze
            ? bronzeCompletedIds.has(task.id)
            : activeLevelCompletedIds.has(task.id)
          const isLocked = !isBronze && levelProgress.current_level !== taskLevel
          const artist = task.artist_id ? artists[task.artist_id] : null

          return (
            <div
              key={task.id}
              className={`border rounded-xl p-4 md:p-6 transition-all ${
                isCompleted
                  ? 'border-green-500 border-opacity-30 bg-green-500 bg-opacity-5'
                  : isLocked
                    ? 'border-gray-600 border-opacity-50 bg-slate-800 bg-opacity-40'
                    : 'border-gray-700 bg-slate-800 hover:border-yellow-400 hover:border-opacity-50'
              }`}
            >
              <div className="flex items-start gap-3 md:gap-4">
                <div className={`p-3 rounded-lg bg-gradient-to-br ${TASK_COLORS[task.task_type] || 'from-slate-600 to-slate-700'} text-white flex-shrink-0`}>
                  {TASK_ICONS[task.task_type] || <BookOpen className="w-6 h-6" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between sm:gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base md:text-lg font-bold text-white break-words">
                        {task.title}
                      </h3>
                      {artist ? (
                        <p className="text-xs md:text-sm text-gray-400 truncate">
                          Artist: <span className="font-semibold text-white">{artist.name}</span>
                        </p>
                      ) : null}
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-1 bg-green-500 bg-opacity-20 px-2 py-1 rounded-full border border-green-500 border-opacity-50 flex-shrink-0 text-nowrap mt-1 sm:mt-0">
                        <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">Completed</span>
                      </div>
                    ) : null}
                  </div>

                  {task.description ? (
                    <p className="text-xs md:text-sm text-gray-400 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  ) : null}

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

                  <p className="text-xs text-gray-500 mb-3">
                    {isBronze
                      ? 'Bronze task: free and can only be completed once.'
                      : `Requires active ${taskLevel.toUpperCase()} level.`}
                  </p>

                  <div className="relative group">
                    <button
                      onClick={() => !isLocked && !isCompleted && handleCompleteTask(task.id)}
                      disabled={isCompleted || isLocked || processingTaskId === task.id}
                      className={`w-full font-bold py-2 md:py-2.5 text-sm md:text-base rounded-lg transition-all ${
                        isLocked
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
                          : isCompleted
                            ? 'bg-green-600 text-white cursor-not-allowed opacity-80'
                            : 'bg-yellow-400 hover:bg-yellow-500 text-slate-900 hover:shadow-lg'
                      }`}
                    >
                      {processingTaskId === task.id ? (
                        <span className="inline-flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : isLocked ? (
                        'Locked'
                      ) : isCompleted ? (
                        'Completed'
                      ) : (
                        'Complete Task'
                      )}
                    </button>
                    {isLocked ? (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 md:px-3 py-1 md:py-2 bg-slate-800 border border-amber-500 border-opacity-50 rounded-lg text-xs text-white font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <span className="inline-flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          Unlock {taskLevel} first
                        </span>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No tasks available</p>
        </div>
      ) : null}
    </div>
  )
}
